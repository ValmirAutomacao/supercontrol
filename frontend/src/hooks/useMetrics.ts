import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ResumoDiario {
  data_referencia: string;
  total_faturamento: number;
  total_recebimento: number;
  gap_total: number;
  gap_percentual: number;
  unidades_com_alerta: number;
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

export function useResumoDiario() {
  const [data, setData] = useState<ResumoDiario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // For now, get just the most recent global summary (simplified)
      // In a real app we'd fetch an aggregate or specifically today
      const { data: result, error } = await supabase
        .from('vw_resumo_diario')
        .select('*')
        .order('data_referencia', { ascending: false })
        .limit(1)
        .single();
        
      if (!error && result) {
        setData(result as ResumoDiario);
      }
      setLoading(false);
    }
    
    fetchData();
  }, []);

  return { data, loading };
}

export function useResumoSubUnidades() {
  const [data, setData] = useState<ResumoSubUnidade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Get sub-units summary for the latest available date
      const { data: result, error } = await supabase
        .from('vw_resumo_sub_unidade')
        .select('*')
        .order('data_referencia', { ascending: false });
        
      if (!error && result) {
        setData(result as ResumoSubUnidade[]);
      }
      setLoading(false);
    }
    
    fetchData();
  }, []);

  return { data, loading };
}

export function useLancamentos() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: result, error } = await supabase
        .from('lancamentos')
        .select('*, unidades(nome)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (!error && result) {
        setData(result);
      }
      setLoading(false);
    }
    
    fetchData();
  }, []);

  return { data, loading };
}
