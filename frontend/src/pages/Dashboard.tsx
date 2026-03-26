import { useState, useRef, useEffect } from 'react';
import { useKpiGeral, useResumoUnidades, dateRangeForPreset, toISODate } from '../hooks/useMetrics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import 'react-day-picker/style.css';

// ─── Inline range picker used only here ──────────────────────────────────────
function RangePicker({ from, to, onApply, onClose }: {
  from: string; to: string;
  onApply: (f: string, t: string) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(new Date());
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({
    from: from ? new Date(from + 'T12:00:00') : undefined,
    to: to ? new Date(to + 'T12:00:00') : undefined,
  });

  const fmt = (d?: Date) => d ? d.toLocaleDateString('pt-BR') : '—';

  const apply = () => {
    if (range.from && range.to) {
      onApply(toISODate(range.from), toISODate(range.to));
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 z-50 bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-4 w-[320px]">
      <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-2">
        {fmt(range.from)} → {fmt(range.to)}
      </div>
      <DayPicker
        mode="range"
        selected={range as any}
        onSelect={(r: any) => setRange(r || {})}
        month={month}
        onMonthChange={setMonth}
        locale={ptBR}
        classNames={{
          today: 'font-extrabold text-blue-400',
          selected: '!bg-blue-600 !text-white !rounded-lg font-bold',
          range_start: '!bg-blue-700 !text-white !rounded-l-lg',
          range_end: '!bg-blue-700 !text-white !rounded-r-lg',
          range_middle: '!bg-blue-900/40 !text-blue-200',
          chevron: 'fill-zinc-400',
          month_caption: 'text-zinc-200 font-bold text-sm',
          nav: 'flex items-center gap-1',
          button_previous: 'w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400',
          button_next: 'w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400',
          month_grid: 'mt-3',
          weekday: 'text-zinc-600 text-[11px] font-bold uppercase tracking-wider w-9 text-center',
          day: 'w-9 h-9 rounded-lg hover:bg-white/10 text-sm text-zinc-300 transition-colors flex items-center justify-center cursor-pointer',
          day_button: 'w-9 h-9 flex items-center justify-center',
          outside: 'text-zinc-800',
        }}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-bold text-zinc-400 hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button onClick={apply} disabled={!range.from || !range.to}
          className="flex-1 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-40">
          Aplicar
        </button>
      </div>
    </div>
  );
}

type Preset = 'hoje' | '7d' | '30d' | 'custom';

export default function Dashboard() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [from, setFrom] = useState(dateRangeForPreset('30d').from);
  const [to, setTo] = useState(dateRangeForPreset('30d').to);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const applyPreset = (p: 'hoje' | '7d' | '30d') => {
    const r = dateRangeForPreset(p);
    setFrom(r.from); setTo(r.to); setPreset(p);
  };

  const applyCustom = (f: string, t: string) => {
    setFrom(f); setTo(t); setPreset('custom'); setShowPicker(false);
  };

  const { data: kpi, loading: loadingKpi } = useKpiGeral(from, to);
  const { data: unidades, loading: loadingChart } = useResumoUnidades(from, to);

  const fmt = (v: number) => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
    return `R$ ${v.toFixed(0)}`;
  };
  const fmtFull = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const faturamento = kpi?.total_faturamento ?? 0;
  const recebimento = kpi?.total_recebimento ?? 0;
  const gap = kpi?.gap_total ?? 0;
  const gapPct = kpi?.gap_percentual ?? 0;

  const discrepancies = unidades.filter(u => u.gap > 0).sort((a, b) => b.gap - a.gap);

  const dateLabel = preset === 'hoje' ? 'Hoje'
    : preset === '7d' ? 'Últimos 7 dias'
    : preset === '30d' ? 'Últimos 30 dias'
    : `${new Date(from + 'T12:00:00').toLocaleDateString('pt-BR')} → ${new Date(to + 'T12:00:00').toLocaleDateString('pt-BR')}`;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Visão Executiva</h1>
          <p className="text-zinc-400 font-medium">Controle de caixa centralizado da rede de unidades.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Preset tabs */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(['hoje', '7d', '30d'] as const).map(p => (
              <button key={p} onClick={() => applyPreset(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  preset === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-zinc-400 hover:text-white'
                }`}>
                {p === 'hoje' ? 'Hoje' : p === '7d' ? '7D' : '30D'}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <div className="relative" ref={pickerRef}>
            <button onClick={() => setShowPicker(!showPicker)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                preset === 'custom'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20 bg-white/5'
              }`}>
              <span className="material-symbols-outlined text-[16px]">date_range</span>
              {preset === 'custom' ? dateLabel : 'Período...'}
            </button>
            {showPicker && <RangePicker from={from} to={to} onApply={applyCustom} onClose={() => setShowPicker(false)} />}
          </div>

          <button className="h-9 px-4 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-xl shadow-white/10">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Relatório PDF
          </button>
        </div>
      </div>

      {/* Period label */}
      <div className="flex items-center gap-2 -mt-4">
        <span className="material-symbols-outlined text-[16px] text-zinc-600">calendar_today</span>
        <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">{dateLabel}</span>
        {(loadingKpi || loadingChart) && <span className="w-3 h-3 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin ml-2"></span>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Recebimento */}
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recebimento</span>
            <span className="material-symbols-outlined text-blue-500 rounded-full bg-blue-500/10 p-2">account_balance_wallet</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-2">{fmt(recebimento)}</div>
          <div className="text-xs text-zinc-500 font-mono">{fmtFull(recebimento)}</div>
        </div>

        {/* Faturamento */}
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Faturamento</span>
            <span className="material-symbols-outlined text-emerald-500 rounded-full bg-emerald-500/10 p-2">trending_up</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-2">{fmt(faturamento)}</div>
          <div className="text-xs text-zinc-500 font-mono">{fmtFull(faturamento)}</div>
        </div>

        {/* Gap */}
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Inadimplência / GAP</span>
            <span className="material-symbols-outlined text-rose-500 rounded-full bg-rose-500/10 p-2">warning</span>
          </div>
          <div className="text-4xl font-black text-white tracking-tighter mb-2">{fmt(gap)}</div>
          <div className="text-xs flex items-center gap-1 font-bold">
            {gapPct > 20 ? (
              <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded animate-pulse">{gapPct}% da receita comprometida</span>
            ) : (
              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{gapPct}% — volume seguro</span>
            )}
          </div>
        </div>
      </div>

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Liquidez por Unidade</h3>
              <p className="text-sm text-zinc-500 mt-1">Faturamento vs. recebimento no período selecionado.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div><span className="text-xs font-bold text-zinc-400">Faturamento</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-zinc-400">Recebimento</span></div>
            </div>
          </div>
          <div className="h-72 w-full mt-4">
            {loadingChart ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Carregando...</div>
            ) : unidades.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unidades} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="unidade_nome" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fafafa', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, undefined]}
                  />
                  <Bar dataKey="faturamento" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} name="Faturamento" />
                  <Bar dataKey="recebimento" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} name="Recebimento" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                Sem dados para o período selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 flex flex-col">

          {/* Neural Insight */}
          <div className="bg-gradient-to-br from-[#13111c] to-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="flex items-center gap-2 text-blue-400 mb-4 relative z-10">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="text-xs font-bold uppercase tracking-widest">Neural Insight</span>
            </div>
            <p className="text-white text-sm leading-relaxed relative z-10 font-medium">
              {faturamento === 0
                ? 'Nenhum dado disponível para o período selecionado. Suba os extratos e faturamentos nas unidades.'
                : gapPct > 20
                  ? `Atenção: GAP de ${gapPct}% detectado (${fmt(gap)}). Unidades com gap: ${discrepancies.length}. Acione a central de cobrança das unidades críticas.`
                  : `Rede estável no período. Faturado: ${fmt(faturamento)}, Recebido: ${fmt(recebimento)}. Conversão de ${100 - gapPct}%.`}
            </p>
          </div>

          {/* Critical units */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4">Unidades com GAP</h3>
            <div className="flex-1 space-y-3">
              {discrepancies.length > 0 ? (
                discrepancies.slice(0, 5).map((disc, idx) => (
                  <div key={disc.unidade_id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
                      <div>
                        <div className="text-sm font-bold text-white">{disc.unidade_nome}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5">{idx === 0 ? 'Risco Alto' : 'Atenção'}</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-rose-400">- {fmt(disc.gap)}</div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
                  <span className="material-symbols-outlined text-emerald-500/50 text-4xl mb-2">check_circle</span>
                  <div className="text-sm font-bold text-emerald-500">Tudo Verde</div>
                  <div className="text-xs text-zinc-500 mt-1">Nenhum gap negativo detectado.</div>
                </div>
              )}
            </div>
            {discrepancies.length > 5 && (
              <button className="mt-4 w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors">
                Ver Todas ({discrepancies.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
