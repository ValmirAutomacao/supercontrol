import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useResumoSubUnidades, useLancamentos } from '../hooks/useMetrics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function UnitDashboard() {
  const { unidadeId } = useParams<{ unidadeId: string }>();
  const [unidade, setUnidade] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingestion'>('overview');

  // Ingestion States
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [recebimentoDisplay, setRecebimentoDisplay] = useState('');
  const [recebimentoValor, setRecebimentoValor] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  const { data: subUnidadesData, loading: loadingStats } = useResumoSubUnidades();
  const { data: lancamentos, loading: loadingLancamentos } = useLancamentos();

  useEffect(() => {
    supabase.from('unidades').select('*').eq('id', unidadeId).single().then(({ data }) => {
      setUnidade(data);
    });
    fetchAiHistory();
  }, [unidadeId]);

  const fetchAiHistory = async () => {
    const { data } = await supabase
      .from('lancamentos')
      .select('*, unidades(nome)')
      .eq('origem', 'pdf_import')
      .eq('unidade_id', unidadeId)
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
    if (unidadeId) formData.append('unidade_id', unidadeId); // Force this explicit unit!

    setUploadStatus(`Enviando ${file.name}...`);
    setUploadLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload');

      setUploadStatus(`Sucesso! Extrator IA processando arquivo em background...`);
      setTimeout(() => {
        setUploadStatus('');
        setUploadLoading(false);
        fetchAiHistory();
      }, 7000);
    } catch (err) {
      console.error(err);
      setUploadStatus('Erro ao conectar com a API Neural.');
      setUploadLoading(false);
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recebimentoValor <= 0) {
      alert("Informe um valor de Recebimento de Caixa maior que zero.");
      return;
    }

    setManualLoading(true);

    try {
      const { data: existing } = await supabase
        .from('lancamentos')
        .select('id')
        .eq('data', dataReferencia)
        .eq('unidade_id', unidadeId)
        .eq('tipo', 'recebimento')
        .eq('origem', 'manual');

      if (existing && existing.length > 0) {
        const confirmOverwrite = window.confirm('Já existe um lançamento manual para esta unidade nesta data. Deseja registrar um novo mesmo assim?');
        if (!confirmOverwrite) {
          setManualLoading(false);
          return;
        }
      }

      const { error } = await supabase.from('lancamentos').insert([{
        data: dataReferencia,
        unidade_id: unidadeId,
        tipo: 'recebimento',
        valor: recebimentoValor,
        origem: 'manual',
      }]);

      if (error) throw error;
      
      alert("Recebimento lançado com sucesso!");
      setRecebimentoDisplay('');
      setRecebimentoValor(0);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar lançamento.");
    } finally {
      setManualLoading(false);
    }
  };

  const handleDeleteAI = async (id: string) => {
    if (!window.confirm("Deseja rejeitar e apagar esta extração da IA?")) return;
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (!error) fetchAiHistory();
    else alert("Erro ao remover: " + error.message);
  };

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const searchKey = normalize(unidade?.nome || '');

  const unitStats = subUnidadesData.filter(d => normalize(d.unidade_nome).includes(searchKey));
  const totalFaturamento = unitStats.reduce((sum, item) => sum + Number(item.faturamento), 0);
  const totalRecebimento = unitStats.reduce((sum, item) => sum + Number(item.recebimento), 0);
  const totalGap = unitStats.reduce((sum, item) => sum + Number(item.gap), 0);
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const unitTransactions = lancamentos.filter((l: any) => l.unidade_id === unidadeId).slice(0, 10);

  if (!unidade || loadingStats || loadingLancamentos) {
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
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{unidade.nome}</h1>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-[#0a0a0a] p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('ingestion')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ingestion' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Lançamentos / IA
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
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
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden mt-6">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="font-bold text-xl text-white">Últimos Lançamentos</h3>
                <p className="text-sm text-zinc-500 mt-1">Histórico detalhado de faturamento e recebimentos na conta da unidade.</p>
              </div>
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
        </>
      ) : (
        /* Ingestion Tab */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Main Workspace: AI Extraction */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* Neural Upload Zone */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <label className={`relative z-10 flex flex-col items-center justify-center border-2 border-dashed rounded-[22px] bg-[#0f0f0f] py-16 px-6 transition-colors duration-300 ${uploadLoading ? 'border-blue-500/50 cursor-wait' : 'border-white/10 group-hover:border-blue-500/50 cursor-pointer'}`}>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploadLoading} />
                
                <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500">
                  <span className={`material-symbols-outlined text-3xl transition-colors ${uploadLoading ? 'text-blue-500' : 'text-zinc-400 group-hover:text-blue-500'}`}>document_scanner</span>
                  {uploadLoading && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Arraste seus relatórios .PDF de Faturamento</h3>
                <p className="text-zinc-500 text-sm text-center max-w-sm mb-6">O motor IA lerá automaticamente os registros designando explicitamente os dados para a unidade <b>{unidade.nome}</b>.</p>
                
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

            {/* AI History Table (Approval Queue) */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden flex-1 flex flex-col">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-[20px]">memory</span>
                    <h3 className="font-bold text-white">Extratos Automáticos da IA</h3>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0f0f0f]">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Data Comp.</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Natureza</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Montante (R$)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-center">Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {aiHistory.length > 0 ? aiHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-zinc-400">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-sm font-bold text-white capitalize">{item.tipo}</td>
                        <td className={`px-6 py-4 text-sm font-bold text-right font-mono ${item.tipo === 'faturamento' ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                              Capturado
                            </span>
                            <button onClick={() => handleDeleteAI(item.id)} className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-zinc-500">
                          Nenhum relatório IA processado para esta unidade recentemente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Workspace: Manual Entry */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 relative">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-rose-500 text-[20px]">keyboard_alt</span>
                <h3 className="font-bold text-white">Lançamento Direto</h3>
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
                  disabled={manualLoading} 
                  type="submit" 
                  className="w-full h-12 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualLoading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">publish</span>
                      Efetivar Recebimento
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* System Info Panel */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6">
               <h3 className="font-bold text-white mb-2 flex items-center gap-3">
                 <span className="material-symbols-outlined text-zinc-500 text-[20px]">info</span>
                 Contexto Isolado
               </h3>
               <p className="text-zinc-500 text-sm">
                 Toda ação efetuada neste painel, incluindo uploads de relatórios neurais, será atrelada unicamente à unidade <b>{unidade.nome}</b>, englobando perfeitamente todas as suas filiais.
               </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
