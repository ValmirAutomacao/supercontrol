import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DataIngestion() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState('');
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [recebimentoDisplay, setRecebimentoDisplay] = useState('');
  const [recebimentoValor, setRecebimentoValor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [apiHealth, setApiHealth] = useState('Loading...');

  const checkApiHealth = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(apiUrl);
      if (res.ok) setApiHealth('Online');
      else setApiHealth('Degraded');
    } catch {
      setApiHealth('Offline');
    }
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('lancamentos')
      .select('*, unidades(nome)')
      .eq('origem', 'pdf_import')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setAiHistory(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, envie apenas arquivos PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus(`Enviando ${file.name}...`);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload');

      setUploadStatus(`Sucesso! Extrator IA processando arquivo em background...`);
      setTimeout(() => setUploadStatus(''), 8000);
    } catch (err) {
      console.error(err);
      setUploadStatus('Erro ao conectar com a API Neural.');
    }
  };

  useEffect(() => {
    supabase.from('unidades').select('*').then(({ data }) => {
      if (data) {
        setUnidades(data);
        if (data.length > 0) setSelectedUnidade(data[0].id);
      }
    });
    fetchHistory();
    checkApiHealth();
  }, []);

  const handleDeleteAI = async (id: string) => {
    if (!window.confirm("Deseja rejeitar e apagar esta extração da IA?")) return;
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (!error) {
      fetchHistory();
    } else {
      alert("Erro ao remover: " + error.message);
    }
  };

  const handleRecebimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, ''); 
    if (!raw) {
      setRecebimentoDisplay('');
      setRecebimentoValor(0);
      return;
    }
    const num = parseInt(raw, 10) / 100;
    setRecebimentoValor(num);
    setRecebimentoDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num));
  };

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (recebimentoValor <= 0) {
      alert("Informe um valor de Recebimento de Caixa maior que zero.");
      return;
    }

    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from('lancamentos')
        .select('id')
        .eq('data', dataReferencia)
        .eq('unidade_id', selectedUnidade)
        .eq('tipo', 'recebimento')
        .eq('origem', 'manual');

      if (existing && existing.length > 0) {
        const confirmOverwrite = window.confirm('Já existe um lançamento manual para esta unidade nesta data. Deseja registrar um novo mesmo assim?');
        if (!confirmOverwrite) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from('lancamentos').insert([{
        data: dataReferencia,
        unidade_id: selectedUnidade,
        tipo: 'recebimento',
        valor: recebimentoValor,
        origem: 'manual',
      }]);

      if (error) throw error;
      
      alert("Recebimento lançado com sucesso!");
      setRecebimentoDisplay('');
      setRecebimentoValor(0);
      fetchHistory(); 
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar lançamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
            <span className="text-[10px] font-bold tracking-widest uppercase">Pipeline de Dados Integrado</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Ingestão & Lançamentos</h1>
          <p className="text-zinc-500 font-medium">Extração de PDFs viabilizada por GPT-4o e terminal manual de caixa.</p>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">history</span>
             <span>Audit Log</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Main Workspace: AI Extraction */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Neural Upload Zone */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-1 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <label className="relative z-10 flex flex-col items-center justify-center border-2 border-dashed border-white/10 group-hover:border-blue-500/50 rounded-[22px] bg-[#0f0f0f] py-16 px-6 cursor-pointer transition-colors duration-300">
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={!!uploadStatus} />
              
              <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-3xl text-zinc-400 group-hover:text-blue-500 transition-colors">document_scanner</span>
                {uploadStatus && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Arraste seus relatórios .PDF do ERP</h3>
              <p className="text-zinc-500 text-sm text-center max-w-sm mb-6">O motor inteligente processará as planilhas e relatórios da franquia, convertendo em métricas para o Dashboard Global.</p>
              
              {uploadStatus ? (
                <div className="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center gap-3 animate-pulse">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span className="text-sm font-bold tracking-wide">{uploadStatus}</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] text-zinc-400 rounded-lg uppercase font-bold tracking-widest">.PDF</span>
                  <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] text-zinc-400 rounded-lg uppercase font-bold tracking-widest">Max 50MB</span>
                </div>
              )}
            </label>
          </div>

          {/* AI History Table */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden flex-1 flex flex-col">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500 text-[20px]">memory</span>
                  <h3 className="font-bold text-white">Extratos de Inteligência Resentes</h3>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0f0f0f]">
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Alvo</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Montante (R$)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-center">Status Confiança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {aiHistory.length > 0 ? aiHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-zinc-400">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{item.unidades?.nome || 'Desconhecida'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-400 text-right font-mono">
                        {item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                            Validado
                          </span>
                          <button onClick={() => handleDeleteAI(item.id)} className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-zinc-500">
                        O pipeline de IA ainda não processou novos relatórios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Workspace: Manual Entry & Health */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Manual Terminal */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative">
            
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-rose-500 text-[20px]">keyboard_alt</span>
              <h3 className="font-bold text-white">Terminal Manual</h3>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-6">
              
              <div className="space-y-5">
                <div className="relative group">
                   <label className="absolute left-3 -top-2 px-1 bg-[#0a0a0a] text-[10px] font-bold text-zinc-500 uppercase tracking-widest z-10 transition-colors group-focus-within:text-white">Data Referência</label>
                   <input 
                     type="date" 
                     value={dataReferencia} 
                     onChange={(e) => setDataReferencia(e.target.value)} 
                     required 
                     className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all" 
                   />
                </div>
                
                <div className="relative group">
                   <label className="absolute left-3 -top-2 px-1 bg-[#0a0a0a] text-[10px] font-bold text-zinc-500 uppercase tracking-widest z-10 transition-colors group-focus-within:text-white">Conta Destino</label>
                   <select 
                     value={selectedUnidade} 
                     onChange={(e) => setSelectedUnidade(e.target.value)} 
                     required 
                     className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all appearance-none"
                   >
                     {unidades.map(u => (
                       <option key={u.id} value={u.id}>{u.nome}</option>
                     ))}
                   </select>
                   <span className="material-symbols-outlined absolute right-3 top-3.5 text-zinc-500 pointer-events-none">expand_more</span>
                </div>
                
                <div className="relative group">
                   <label className="absolute left-3 -top-2 px-1 bg-[#0a0a0a] text-[10px] font-bold text-emerald-500 uppercase tracking-widest z-10 transition-colors">Caixa Recebido</label>
                   <input 
                     type="text" 
                     value={recebimentoDisplay} 
                     onChange={handleRecebimentoChange} 
                     placeholder="R$ 0,00" 
                     className="w-full bg-[#0a0a0a] border border-emerald-500/30 rounded-xl p-3.5 text-lg text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/10 transition-all font-mono" 
                   />
                </div>
              </div>
              
              <button 
                disabled={loading} 
                type="submit" 
                className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                    Efetivar Transação
                  </>
                )}
              </button>
            </form>
          </div>

          {/* System Telemetry */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-zinc-500 text-[20px]">satellite_alt</span>
              Telemetria Sistêmica
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[18px] ${apiHealth === 'Online' ? 'text-zinc-400' : 'text-rose-400'}`}>api</span>
                  <span className="text-xs font-bold text-zinc-300">Gateway Core</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${apiHealth === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${apiHealth === 'Online' ? 'text-emerald-500' : 'text-rose-500'}`}>{apiHealth}</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-zinc-400 text-[18px]">neurology</span>
                  <span className="text-xs font-bold text-zinc-300">GPT-4o Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-[10px] uppercase font-bold text-blue-500 tracking-widest">Active</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
