import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DataIngestion() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState('');
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [faturamento, setFaturamento] = useState('');
  const [recebimento, setRecebimento] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('unidades').select('*').then(({ data }) => {
      if (data) {
        setUnidades(data);
        if (data.length > 0) setSelectedUnidade(data[0].id);
      }
    });
  }, []);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const faturamentoNum = parseFloat(faturamento.replace(',', '.'));
      const recebimentoNum = parseFloat(recebimento.replace(',', '.'));

      const inserts = [];

      if (!isNaN(faturamentoNum) && faturamentoNum > 0) {
        inserts.push({
          data: dataReferencia,
          unidade_id: selectedUnidade,
          tipo: 'faturamento',
          valor: faturamentoNum,
          origem: 'manual',
        });
      }

      if (!isNaN(recebimentoNum) && recebimentoNum > 0) {
        inserts.push({
          data: dataReferencia,
          unidade_id: selectedUnidade,
          tipo: 'recebimento',
          valor: recebimentoNum,
          origem: 'manual',
        });
      }

      if (inserts.length > 0) {
        const { error } = await supabase.from('lancamentos').insert(inserts);
        if (error) throw error;
        alert("Lançamento salvo com sucesso!");
        setFaturamento('');
        setRecebimento('');
      } else {
        alert("Informe ao menos um valor de Faturamento ou Recebimento.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar lançamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span className="text-xs font-bold tracking-widest uppercase">Smart Pipeline</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Ingestão de Dados & Lançamentos</h1>
          <p className="text-on-surface-variant mt-1">Sincronização automática de PDFs e envio manual de dados contábeis.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-lg text-sm font-medium hover:bg-surface-bright transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">history</span>
            Ver Histórico
          </button>
          <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-sm">cloud_upload</span>
            Nova Extração
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Workspace: PDF Upload & IA Preview */}
        <section className="lg:col-span-8 space-y-6">
          {/* Drag & Drop Zone */}
          <div className="bg-surface-container border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center group hover:border-primary/50 transition-colors cursor-pointer bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-primary">picture_as_pdf</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Arraste arquivos do Águia Web</h3>
            <p className="text-on-surface-variant text-sm text-center max-w-xs mt-2">Arraste os relatórios PDF exportados do ERP para iniciar a extração inteligente.</p>
            <div className="mt-6 flex gap-2">
              <span className="px-2 py-1 bg-surface-container-low border border-outline-variant text-[10px] text-secondary-fixed rounded uppercase font-bold tracking-tighter">Formatos: PDF, CSV</span>
              <span className="px-2 py-1 bg-surface-container-low border border-outline-variant text-[10px] text-secondary-fixed rounded uppercase font-bold tracking-tighter">Max: 50MB</span>
            </div>
          </div>

          {/* Extraction Progress & Preview Table */}
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary">psychology</span>
                <h3 className="font-bold text-on-surface">Pré-visualização da Extração IA</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Data</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Unidade</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">Valor (R$)</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="hover:bg-surface-bright transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">12/10/2023</td>
                    <td className="px-6 py-4 text-sm font-mono text-primary">ILH-CENTRO-01</td>
                    <td className="px-6 py-4 text-sm font-bold text-right">R$ 14.250,00</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-tertiary/10 text-tertiary uppercase">Validado</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sidebar Workspace: Excel Sync & Actions */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-tertiary">table_chart</span>
              <h3 className="font-bold text-on-surface">Lançamento Manual</h3>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg space-y-4">
                <div>
                   <label className="text-xs font-bold text-on-surface-variant uppercase">Data Referência</label>
                   <input type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} required className="w-full mt-1 bg-surface-container border border-outline-variant rounded p-2 text-sm text-on-surface" />
                </div>
                <div>
                   <label className="text-xs font-bold text-on-surface-variant uppercase">Unidade</label>
                   <select value={selectedUnidade} onChange={(e) => setSelectedUnidade(e.target.value)} required className="w-full mt-1 bg-surface-container border border-outline-variant rounded p-2 text-sm text-on-surface">
                     {unidades.map(u => (
                       <option key={u.id} value={u.id}>{u.nome}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-on-surface-variant uppercase">Faturamento (R$)</label>
                   <input type="number" step="0.01" value={faturamento} onChange={(e) => setFaturamento(e.target.value)} placeholder="0.00" className="w-full mt-1 bg-surface-container border border-outline-variant rounded p-2 text-sm text-on-surface" />
                </div>
                <div>
                   <label className="text-xs font-bold text-on-surface-variant uppercase">Recebimento de Caixa (R$)</label>
                   <input type="number" step="0.01" value={recebimento} onChange={(e) => setRecebimento(e.target.value)} placeholder="0.00" className="w-full mt-1 bg-surface-container border border-outline-variant rounded p-2 text-sm text-on-surface" />
                </div>
              </div>
              
              <button disabled={loading} type="submit" className="w-full py-3 bg-tertiary text-on-tertiary rounded-lg font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">sync</span>
                {loading ? 'Salvando...' : 'Confirmar Lançamento'}
              </button>
            </form>
          </div>

          {/* System Health & Monitoring */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6">
            <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">terminal</span>
              Saúde do Sistema
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">API Águia Web</span>
                <span className="text-tertiary font-mono">ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">AI Model v4.2</span>
                <span className="text-tertiary font-mono">READY</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
