import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Reports() {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('lancamentos')
      .select('*, unidades(nome)')
      .eq('data', filtroData)
      .order('created_at', { ascending: false });
      
    if (data) setLancamentos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filtroData]);

  const exportCSV = () => {
    const headers = ['Data', 'Unidade', 'Tipo', 'Origem', 'Valor (R$)'];
    const rows = lancamentos.map(l => [
      l.data, 
      l.unidades?.nome || 'Desconhecida', 
      l.tipo,
      l.origem,
      l.valor.toFixed(2)
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n"
      + rows.map(e => e.join(',')).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fechamento_${filtroData}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 mb-2">
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span className="text-[10px] font-bold tracking-widest uppercase">Central de Relatórios</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Fechamento Diário</h1>
          <p className="text-zinc-500 font-medium">Extraia logs detalhados de faturamento e recebimentos em toda a rede.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="date" 
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="h-10 px-4 bg-[#0a0a0a] border border-white/10 text-white rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <button 
            onClick={exportCSV}
            className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
             <span className="material-symbols-outlined text-[18px]">download</span>
             <span>Exportar .CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-zinc-500">list_alt</span>
            Transações do Dia ({lancamentos.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-10 flex items-center justify-center">
             <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0f0f0f]">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Horário Registro</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Unidade</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Tipo / Natureza</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Origem</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {lancamentos.length > 0 ? lancamentos.map((l: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">{new Date(l.created_at).toLocaleTimeString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white">{l.unidades?.nome || 'Desconhecida'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 px-1 text-[10px] font-bold uppercase tracking-wider rounded border ${l.tipo === 'faturamento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {l.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 capitalize">{l.origem.replace('_', ' ')}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right font-mono ${l.tipo === 'faturamento' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {l.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500 italic">
                      Nenhum lançamento foi processado para a data selecionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
