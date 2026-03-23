
import { useResumoDiario, useResumoSubUnidades } from '../hooks/useMetrics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: diario, loading: loadingDiario } = useResumoDiario();
  const { data: subUnidades, loading: loadingSubUnidades } = useResumoSubUnidades();

  if (loadingDiario || loadingSubUnidades) {
    return <div className="p-8 text-on-surface">Carregando métricas...</div>;
  }

  // Fallback for empty data
  const faturamento = diario?.total_faturamento ?? 0;
  const recebimento = diario?.total_recebimento ?? 0;
  const gap = diario?.gap_total ?? 0;
  const gapPercentual = diario?.gap_percentual ?? 0;

  const formatCurrency = (val: number) => `R$ ${(val/1000).toFixed(1)}k`;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">Visão Geral de Caixa</h1>
          <p className="text-on-surface-variant">Acompanhamento diário das vendas e dinheiro em caixa de cada unidade.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-bright transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Last 30 Days
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics Cards - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-container border border-outline-variant rounded-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Faturamento Total</span>
            <span className="material-symbols-outlined text-primary">receipt_long</span>
          </div>
          <div>
            <div className="text-2xl font-black text-on-surface">{formatCurrency(faturamento)}</div>
            <div className="text-xs text-tertiary flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-surface-container border border-outline-variant rounded-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Recebimento Total</span>
            <span className="material-symbols-outlined text-tertiary">payments</span>
          </div>
          <div>
            <div className="text-2xl font-black text-on-surface">{formatCurrency(recebimento)}</div>
            <div className="text-xs text-tertiary flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-surface-container border border-outline-variant rounded-xl flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Gap Total</span>
            <span className="material-symbols-outlined text-error">difference</span>
          </div>
          <div className="z-10">
            <div className="text-2xl font-black text-on-surface">{formatCurrency(gap)}</div>
            <div className="text-xs text-error flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              {gapPercentual}% Gap
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-8xl">account_balance</span>
          </div>
        </div>

        <div className="p-5 bg-surface-container border border-outline-variant rounded-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Insight IA</span>
            <span className="material-symbols-outlined text-primary">query_stats</span>
          </div>
          <div>
            <div className="text-2xl font-black text-on-surface">Atenção</div>
            <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
              Itabuna precisa de atenção imediata.
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Performance Chart */}
        <div className="lg:col-span-2 p-6 bg-surface-container border border-outline-variant rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-lg text-on-surface">Faturamento vs Recebimento por Unidade</h3>
              <p className="text-sm text-on-surface-variant">Regional performance comparison</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs text-on-surface-variant">Faturamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                <span className="text-xs text-on-surface-variant">Recebimento</span>
              </div>
            </div>
          </div>

          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subUnidades} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="sub_unidade_nome" tick={{fill: '#a1a1aa', fontSize: 12}} />
                <YAxis tick={{fill: '#a1a1aa', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fafafa' }}
                />
                <Bar dataKey="faturamento" fill="#a78bfa" name="Faturamento" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recebimento" fill="#34d399" name="Recebimento" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Discrepancies List */}
        <div className="p-6 bg-surface-container border border-outline-variant rounded-xl flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-on-surface">Discrepâncias Críticas</h3>
            <p className="text-sm text-on-surface-variant">Ação imediata necessária</p>
          </div>
          <div className="flex-1 space-y-4">
            <div className="p-4 bg-surface-container-high border-l-4 border-error rounded-r-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-on-surface">Itabuna (VF Comercio)</div>
                <div className="text-xs text-on-surface-variant">Faturamento sem recebimento</div>
              </div>
              <div className="text-right">
                <div className="text-error font-black">- R$ 112k</div>
                <div className="text-[10px] uppercase font-bold text-error animate-pulse">Critical Gap</div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-high border-l-4 border-[#f59e0b] rounded-r-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-on-surface">Conquista Norte</div>
                <div className="text-xs text-on-surface-variant">Atraso recorrente</div>
              </div>
              <div className="text-right">
                <div className="text-[#f59e0b] font-black">- R$ 32k</div>
                <div className="text-[10px] uppercase font-bold text-[#f59e0b]">Reviewing</div>
              </div>
            </div>
          </div>
          <button className="mt-6 w-full py-3 border border-outline-variant rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-surface-bright transition-colors">
            Ver todas as discrepâncias
          </button>
        </div>
      </div>
    </div>
  );
}
