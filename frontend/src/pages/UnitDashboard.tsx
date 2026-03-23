import { useParams } from 'react-router-dom';
import { useResumoSubUnidades, useLancamentos } from '../hooks/useMetrics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function UnitDashboard() {
  const { unidadeId } = useParams<{ unidadeId: string }>();
  
  // Revert slug back to a matching name (basic heuristic since we fetch real units in sidebar)
  // But ideally we just check if it matches ignoring case/spaces
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const searchKey = normalize(unidadeId || '');

  const { data: subUnidadesData, loading } = useResumoSubUnidades();
  const { data: lancamentos } = useLancamentos();

  const unitStats = subUnidadesData.filter(d => normalize(d.unidade_nome).includes(searchKey));
  
  // Assuming the first match is our unit name
  const realUnitName = unitStats.length > 0 ? unitStats[0].unidade_nome : (unidadeId || 'Unidade Operacional').toUpperCase();

  const totalFaturamento = unitStats.reduce((sum, item) => sum + Number(item.faturamento), 0);
  const totalRecebimento = unitStats.reduce((sum, item) => sum + Number(item.recebimento), 0);
  const totalGap = unitStats.reduce((sum, item) => sum + Number(item.gap), 0);
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Filter lancamentos that belong to this unit (using name match since we don't have ID in this specific view)
  const unitTransactions = lancamentos.filter((l: any) => l.unidades && normalize(l.unidades.nome).includes(searchKey)).slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Conectando ao banco de dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="material-symbols-outlined text-white text-3xl">storefront</span>
          </div>
          <div>
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Hub Local Ativo</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{realUnitName}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">sync</span>
             <span>Sincronizar</span>
          </button>
          <button className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">add</span>
             <span>Lançar Resumo</span>
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Unit Health Widget */}
        <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl flex flex-col relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full opacity-10 transition-opacity ${totalGap > 0 ? 'bg-rose-500' : 'bg-emerald-500 group-hover:opacity-20'}`}></div>
          
          <div className="flex justify-between items-start mb-10 relative z-10">
            <h3 className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Diagnóstico Atual</h3>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${totalGap > 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
              {totalGap > 0 ? 'Alerta de Fluxo' : 'Operação 100%'}
            </span>
          </div>

          <div className="space-y-8 flex-1 relative z-10">
            <div>
              <p className="text-sm text-zinc-500 mb-1 font-medium">Volumetria Processada (Bruto)</p>
              <div className="text-4xl font-black text-white tracking-tighter">{formatCurrency(totalFaturamento)}</div>
            </div>
            
            <div>
              <p className="text-sm text-zinc-500 mb-1 font-medium mt-4">Gap em Aberto (Risco)</p>
              <div className={`text-2xl font-bold tracking-tighter ${totalGap > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                {totalGap > 0 ? `- ${formatCurrency(totalGap)}` : 'R$ 0,00'}
              </div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-emerald-500">Conversão de Caixa</span>
                <span className="text-zinc-300">{totalFaturamento > 0 ? ((totalRecebimento / totalFaturamento) * 100).toFixed(1) : '0'}%</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${totalGap > 0 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} 
                  style={{ width: totalFaturamento > 0 ? `${Math.min(100, (totalRecebimento / totalFaturamento) * 100)}%` : '0%' }}>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Evolução do Faturamento Mensal</h3>
              <p className="text-sm text-zinc-500">Acompanhamento da curva de liquidez ao longo do mês</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] -ml-6 mt-4">
            {unitStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={unitStats} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="sub_unidade_nome" tick={{fill: '#71717a', fontSize: 11, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{fill: '#71717a', fontSize: 11}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fafafa' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="faturamento" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamento)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-zinc-600 font-medium">Gráfico indisponível para esta unidade.</div>
            )}
          </div>
        </div>

      </div>

      {/* Transactions Table Section */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="font-bold text-xl text-white">Últimos Lançamentos</h3>
            <p className="text-sm text-zinc-500 mt-1">Histórico detalhado de faturamento e recebimentos na conta da unidade.</p>
          </div>
          <button className="text-sm font-bold text-emerald-500 hover:text-white transition-colors">
            Visualizar Todos
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0f0f0f]">
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Data (Reference)</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Operação</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Valor Registrado</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-center">Protocolo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {unitTransactions.length > 0 ? unitTransactions.map((tx: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 font-mono text-sm text-zinc-400">{new Date(tx.data).toLocaleDateString('pt-BR')}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tx.tipo === 'faturamento' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                      <span className="text-sm font-bold text-zinc-200 capitalize">{tx.tipo}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-zinc-500 uppercase tracking-wider">{tx.origem === 'pdf_import' ? 'IA Automail' : 'Manual'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-white text-right font-mono">
                    R$ {tx.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[14px]">done_all</span> Verificado
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-sm text-zinc-500 italic">
                    Nenhum histórico recente registrado para esta unidade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
