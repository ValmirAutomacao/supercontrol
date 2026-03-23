import { useParams } from 'react-router-dom';
import { useResumoSubUnidades } from '../hooks/useMetrics';

export default function UnitDashboard() {
  const { id } = useParams<{ id: string }>();
  
  const formatUnitName = (name: string) => {
    if (!name) return 'Unidade Operacional';
    const names: Record<string, string> = {
      'ilheus': 'GF Ilhéus',
      'itabuna': 'GF Itabuna',
      'itapetinga': 'GF Itapetinga',
      'conquista': 'GF Vitória da Conquista',
      'santa-cruz': 'Santa Cruz Tecnologia',
      'santacruz': 'Santa Cruz Tecnologia'
    };
    return names[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
  };

  const unitName = formatUnitName(id || '');
  const { data: subUnidadesData, loading } = useResumoSubUnidades();

  // Filter the view data to just this unit. 
  const unitStats = subUnidadesData.filter(d => 
    d.unidade_nome.toLowerCase().includes(unitName.toLowerCase().replace('gf ', '')) ||
    unitName.toLowerCase().includes(d.unidade_nome.toLowerCase())
  );

  // Calculate aggregates for this unit based on its sub-units (or just its own row)
  const totalFaturamento = unitStats.reduce((sum, item) => sum + Number(item.faturamento), 0);
  const totalRecebimento = unitStats.reduce((sum, item) => sum + Number(item.recebimento), 0);
  const totalGap = unitStats.reduce((sum, item) => sum + Number(item.gap), 0);
  
  // Format to BRL
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="material-symbols-outlined text-sm">hub</span>
            <span className="text-xs font-bold uppercase tracking-widest">Hub de Operações</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">{unitName}</h1>
          <p className="text-on-surface-variant mt-1">Gestão centralizada da unidade</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Forçar Sincronização
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Unit Health Widget */}
        <div className="md:col-span-4 bg-surface-container border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">monitor_heart</span>
                Saúde da Unidade
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${totalGap > 0 ? 'bg-error/10 text-error border-error/20' : 'bg-tertiary/10 text-tertiary border-tertiary/20'}`}>
                {totalGap > 0 ? 'ALERTA DE GAP' : 'OTIMIZADO'}
              </span>
            </div>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-surface-container-high rounded w-1/3"></div>
                <div className="h-8 bg-surface-container-high rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-on-surface-variant mb-1">FATURAMENTO TOTAL</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-on-surface tracking-tighter">{formatCurrency(totalFaturamento)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant mb-1 mt-2">GAP ATUAL (Falta Receber)</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold tracking-tighter ${totalGap > 0 ? 'text-error' : 'text-on-surface'}`}>
                      {formatCurrency(totalGap)}
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden mt-4">
                  <div 
                    className={`h-full ${totalGap > 0 ? 'bg-error' : 'bg-tertiary'}`} 
                    style={{ width: totalFaturamento > 0 ? `${Math.min(100, (totalRecebimento / totalFaturamento) * 100)}%` : '0%' }}>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant italic leading-tight">
                  {totalFaturamento > 0 ? `${((totalRecebimento / totalFaturamento) * 100).toFixed(1)}% recebido em relação ao faturamento.` : 'Sem movimentação no período.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sync Status Cards */}
        <div className="md:col-span-4 grid grid-rows-2 gap-4">
          <div className="bg-surface-container border border-outline-variant p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Águia Web PDF</p>
              <p className="text-sm font-bold text-on-surface">Extrator Automático</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-tertiary"></span>
                <span className="text-[10px] text-tertiary font-bold">ÚLTIMA EXTRAÇÃO: 14:32</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">table_chart</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Manual Excel Sync</p>
              <p className="text-sm font-bold text-on-surface">Sincronização de Lançamento</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-error"></span>
                <span className="text-[10px] text-error font-bold">REQUER ATENÇÃO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-units Quick View */}
        <div className="md:col-span-4 bg-surface-container border border-outline-variant p-6 rounded-xl">
          <h3 className="font-bold text-on-surface-variant mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">account_tree</span>
            Sub-unidades
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-center py-6 text-on-surface-variant italic">
              Nenhuma sub-unidade cadastrada para este pólo.
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-bold text-lg text-on-surface">Transações Diárias</h3>
          <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">search</span>
            <input className="bg-transparent border-none text-xs focus:ring-0 text-on-surface w-48 placeholder:text-outline" placeholder="Filtrar por ID..." type="text" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high">
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant tracking-widest uppercase">ID Transação</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant tracking-widest uppercase">Sub-unidade</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant tracking-widest uppercase">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant tracking-widest uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-on-surface-variant tracking-widest uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                  Nenhuma transação recente encontrada no banco de dados para esta unidade.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
