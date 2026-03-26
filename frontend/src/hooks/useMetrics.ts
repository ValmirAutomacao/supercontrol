import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface KpiGeral {
  total_faturamento: number;
  total_recebimento: number;
  gap_total: number;
  gap_percentual: number;
}

export interface ResumoUnidade {
  unidade_id: string;
  unidade_nome: string;
  faturamento: number;
  recebimento: number;
  gap: number;
}

export interface ResumoSubUnidade {
  unidade_nome: string;
  sub_unidade_nome: string;
  data_referencia: string;
  faturamento: number;
  recebimento: number;
  gap: number;
  gap_percentual: number;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function dateRangeForPreset(preset: 'hoje' | '7d' | '30d'): { from: string; to: string } {
  const today = new Date();
  const to = toISODate(today);
  if (preset === 'hoje') return { from: to, to };
  const from = new Date(today);
  from.setDate(today.getDate() - (preset === '7d' ? 6 : 29));
  return { from: toISODate(from), to };
}

// ─── useKpiGeral ─────────────────────────────────────────────────────────────
// Aggregates KPIs for the whole network in a date range
export function useKpiGeral(from: string, to: string) {
  const [data, setData] = useState<KpiGeral | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('lancamentos')
      .select('tipo, valor')
      .gte('data', from)
      .lte('data', to);

    if (rows) {
      const fat = rows.filter(r => r.tipo === 'faturamento').reduce((s, r) => s + Number(r.valor), 0);
      const rec = rows.filter(r => r.tipo === 'recebimento').reduce((s, r) => s + Number(r.valor), 0);
      const gap = fat - rec;
      setData({
        total_faturamento: fat,
        total_recebimento: rec,
        gap_total: gap,
        gap_percentual: fat > 0 ? Math.round((gap / fat) * 100) : 0,
      });
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refresh: fetch };
}

// ─── useResumoUnidades ────────────────────────────────────────────────────────
// Per-unit aggregation for the bar chart
export function useResumoUnidades(from: string, to: string) {
  const [data, setData] = useState<ResumoUnidade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('lancamentos')
      .select('unidade_id, tipo, valor, unidades(nome)')
      .gte('data', from)
      .lte('data', to);

    if (rows) {
      const map: Record<string, ResumoUnidade> = {};
      rows.forEach((r: any) => {
        const uid = r.unidade_id;
        if (!map[uid]) map[uid] = { unidade_id: uid, unidade_nome: r.unidades?.nome || uid, faturamento: 0, recebimento: 0, gap: 0 };
        if (r.tipo === 'faturamento') map[uid].faturamento += Number(r.valor);
        else map[uid].recebimento += Number(r.valor);
      });
      Object.values(map).forEach(u => { u.gap = u.faturamento - u.recebimento; });
      setData(Object.values(map).sort((a, b) => b.faturamento - a.faturamento));
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refresh: fetch };
}

// ─── useKpiUnidade ────────────────────────────────────────────────────────────
// KPIs for a single unit (used in UnitDashboard)
export function useKpiUnidade(unidadeId: string | undefined) {
  const [fat, setFat] = useState(0);
  const [rec, setRec] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unidadeId) return;
    supabase
      .from('lancamentos')
      .select('tipo, valor')
      .eq('unidade_id', unidadeId)
      .then(({ data: rows }) => {
        if (rows) {
          setFat(rows.filter(r => r.tipo === 'faturamento').reduce((s, r) => s + Number(r.valor), 0));
          setRec(rows.filter(r => r.tipo === 'recebimento').reduce((s, r) => s + Number(r.valor), 0));
        }
        setLoading(false);
      });
  }, [unidadeId]);

  const gap = fat - rec;
  const pct = fat > 0 ? (rec / fat) * 100 : 0;
  return { fat, rec, gap, pct, loading };
}

// ─── Legacy exports kept for compatibility ─────────────────────────────────
export function useResumoDiario() {
  const range = dateRangeForPreset('hoje');
  const { data, loading } = useKpiGeral(range.from, range.to);
  const compat = data ? {
    data_referencia: range.to,
    total_faturamento: data.total_faturamento,
    total_recebimento: data.total_recebimento,
    gap_total: data.gap_total,
    gap_percentual: data.gap_percentual,
    unidades_com_alerta: 0,
  } : null;
  return { data: compat, loading };
}

export function useResumoSubUnidades() {
  const { data: unidades, loading } = useResumoUnidades(
    toISODate(new Date(new Date().setDate(new Date().getDate() - 29))),
    toISODate(new Date())
  );
  // Map to legacy shape
  const compat = unidades.map(u => ({
    unidade_nome: u.unidade_nome,
    sub_unidade_nome: u.unidade_nome,
    data_referencia: toISODate(new Date()),
    faturamento: u.faturamento,
    recebimento: u.recebimento,
    gap: u.gap,
    gap_percentual: u.faturamento > 0 ? Math.round((u.gap / u.faturamento) * 100) : 0,
  }));
  return { data: compat as ResumoSubUnidade[], loading };
}

export function useLancamentos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('lancamentos')
      .select('*, unidades(nome)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data: result }) => {
        if (result) setData(result);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
