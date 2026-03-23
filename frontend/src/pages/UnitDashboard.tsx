

export default function UnitDashboard() {
  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <span className="material-symbols-outlined text-sm">hub</span>
            <span className="text-xs font-bold uppercase tracking-widest">Hub de Operações</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">Unidade Operacional</h1>
          <p className="text-on-surface-variant mt-1">Gestão centralizada</p>
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
              <span className="bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-full border border-tertiary/20">OTIMIZADO</span>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-on-surface-variant mb-1">GAP MENSAL ATUAL</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-on-surface tracking-tighter">R$ 12.450,00</span>
                  <span className="text-tertiary text-sm font-bold flex items-center">
                    <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    12%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-[88%]"></div>
              </div>
              <p className="text-xs text-on-surface-variant italic leading-tight">Projeção de fechamento dentro da meta estabelecida.</p>
            </div>
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
            <div className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg border border-outline-variant/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm font-bold">Sub-Unidade A</span>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">ID: 001</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg border border-outline-variant/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                <span className="text-sm font-bold">Sub-Unidade B</span>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">ID: 002</span>
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
              <tr className="hover:bg-surface-container-highest transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-primary">#TX-99210</td>
                <td className="px-6 py-4 text-sm font-bold">Sub-Unidade A</td>
                <td className="px-6 py-4 text-sm">R$ 450,00</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                    <span className="text-xs">Processado</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
