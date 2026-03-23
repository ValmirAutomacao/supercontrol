import { useResumoDiario, useResumoSubUnidades } from '../hooks/useMetrics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { data: diario, loading: loadingDiario } = useResumoDiario();
  const { data: subUnidades, loading: loadingSubUnidades } = useResumoSubUnidades();

  if (loadingDiario || loadingSubUnidades) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Carregando métricas da Neural Engine...</span>
        </div>
      </div>
    );
  }

  const faturamento = diario?.total_faturamento ?? 0;
  const recebimento = diario?.total_recebimento ?? 0;
  const gap = diario?.gap_total ?? 0;
  const gapPercentual = diario?.gap_percentual ?? 0;

  const formatCurrency = (val: number) => `R$ ${(val/1000).toFixed(1)}k`;

  const discrepancies = subUnidades
    ? subUnidades.filter((s:any) => s.gap > 0).sort((a:any, b:any) => b.gap - a.gap)
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Visão Executiva</h1>
          <p className="text-zinc-400 font-medium">Controle de caixa centralizado da rede de unidades.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            <button className="px-4 py-1.5 text-xs font-bold text-white bg-blue-500 rounded-md shadow-lg shadow-blue-500/20">Hoje</button>
            <button className="px-4 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors">7D</button>
            <button className="px-4 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors">30D</button>
          </div>
          <button className="h-9 px-4 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-xl shadow-white/10">
             <span className="material-symbols-outlined text-[18px]">download</span>
             <span>Relatório PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Glassmorphic sleek look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Receita Card */}
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recebimento Atual</span>
            <span className="material-symbols-outlined text-blue-500 rounded-full bg-blue-500/10 p-2">account_balance_wallet</span>
          </div>
          <div>
            <div className="text-4xl font-black text-white tracking-tighter mb-2">{formatCurrency(recebimento)}</div>
            <div className="text-xs text-zinc-400 flex items-center gap-1">
              <span className="text-emerald-500 flex items-center font-bold">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +14.5%
              </span>
              em relação a ontem
            </div>
          </div>
        </div>

        {/* Faturamento Card */}
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Faturamento Realizado</span>
            <span className="material-symbols-outlined text-emerald-500 rounded-full bg-emerald-500/10 p-2">trending_up</span>
          </div>
          <div>
            <div className="text-4xl font-black text-white tracking-tighter mb-2">{formatCurrency(faturamento)}</div>
            <div className="text-xs text-zinc-400 flex items-center gap-1">
               <span className="text-zinc-500">Valor bruto processado pelas unidades</span>
            </div>
          </div>
        </div>

        {/* Gap Card */}
        <div className="p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Inadimplência / GAP</span>
            <span className="material-symbols-outlined text-rose-500 rounded-full bg-rose-500/10 p-2">warning</span>
          </div>
          <div>
            <div className="text-4xl font-black text-white tracking-tighter mb-2">{formatCurrency(gap)}</div>
            <div className="text-xs flex items-center gap-1 font-bold">
              {gapPercentual > 20 ? (
                <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded animate-pulse">{gapPercentual}% da Receita Comprometida</span>
              ) : (
                <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{gapPercentual}% (Volume Seguro)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart View */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Performance de Liquidez por Unidade</h3>
              <p className="text-sm text-zinc-500 mt-1">Comparativo de faturamento bruto vs. recebimento efetuado no caixa.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-zinc-400">Recebimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <span className="text-xs font-bold text-zinc-400">Faturamento</span>
              </div>
            </div>
          </div>
          
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subUnidades} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="unidade_nome" tick={{fill: '#71717a', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: '#71717a', fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fafafa', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                  labelStyle={{ color: '#a1a1aa', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}
                />
                <Bar dataKey="faturamento" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="recebimento" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight & Discrepancies */}
        <div className="space-y-6 flex flex-col">
          
          {/* Neural Target Card */}
          <div className="bg-gradient-to-br from-[#13111c] to-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
            <div className="flex items-center gap-2 text-blue-400 mb-4 relative z-10">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="text-xs font-bold uppercase tracking-widest">Neural Insight</span>
            </div>
            <p className="text-white text-sm leading-relaxed relative z-10 font-medium">
              {gapPercentual > 20 
                ? "Atenção: A rede apresenta um volume de GAP elevado superior a 20%. Historicamente, GAPs detectados nesta faixa resultam em déficit de fluxo de caixa para a próxima semana. Recomenda-se acionar a central de cobrança das unidades críticas."
                : "A operação de fluxo de caixa da rede GF encontra-se perfeitamente estabilizada no dia de hoje, com conversão excelente entre faturado e recebido. Nenhuma intervenção sistêmica é necessária."}
            </p>
          </div>

          {/* Critical Discrepancies */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4">Unidades Críticas</h3>
            
            <div className="flex-1 space-y-3">
              {discrepancies.length > 0 ? (
                discrepancies.slice(0, 4).map((disc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
                      <div>
                        <div className="text-sm font-bold text-white">{disc.unidade_nome}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold mt-0.5">{idx === 0 ? 'Risco Alto' : 'Atenção'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-rose-400">- {formatCurrency(disc.gap)}</div>
                    </div>
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
            
            {discrepancies.length > 4 && (
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
