import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useResumoSubUnidades, useLancamentos } from '../hooks/useMetrics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DatePickerInput from '../components/DatePickerInput';

// ─── Reconciliation sub-component ────────────────────────────────────────────
function ReconciliationTable({ unidadeId }: { unidadeId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('vw_conciliacao')
      .select('*')
      .eq('unidade_id', unidadeId)
      .order('data', { ascending: false })
      .limit(14)
      .then(({ data }) => {
        if (data) setRows(data);
        setLoading(false);
      });
  }, [unidadeId]);

  const fmt = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden mt-6">
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <span className="material-symbols-outlined text-indigo-500 text-[20px]">balance</span>
        <h3 className="font-bold text-white">Conciliação Faturamento × Recebimento</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0f0f0f]">
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Data</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Faturado</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Recebido</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Gap</th>
              <th className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-zinc-600">Carregando...</td></tr>
            ) : rows.length > 0 ? rows.map((r, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-zinc-400">
                  {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-blue-400 text-right font-mono">{fmt(r.total_faturado)}</td>
                <td className="px-6 py-4 text-sm font-bold text-emerald-400 text-right font-mono">{fmt(r.total_recebido)}</td>
                <td className={`px-6 py-4 text-sm font-bold text-right font-mono ${r.gap > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                  {r.gap > 0 ? `- ${fmt(r.gap)}` : 'R$ 0,00'}
                </td>
                <td className="px-6 py-4 text-center">
                  {r.gap > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Gap
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> OK
                    </span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-zinc-600 italic">
                  Nenhum dado para conciliar ainda. Suba o Faturamento e o Extrato Bancário.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Upload Zone sub-component ────────────────────────────────────────────────
interface UploadZoneProps {
  title: string;
  subtitle: string;
  icon: string;
  accentClass: string;
  date: string;
  onDateChange: (d: string) => void;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  status: string;
  loading: boolean;
  extra?: React.ReactNode;
}

function UploadZone({ title, subtitle, icon, accentClass, date, onDateChange, onFile, status, loading, extra }: UploadZoneProps) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-[20px] ${accentClass}`}>{icon}</span>
        <div>
          <h3 className="font-bold text-white leading-none">{title}</h3>
          <p className="text-zinc-600 text-xs mt-1">{subtitle}</p>
        </div>
      </div>

      <DatePickerInput
        label="Data de Referência"
        value={date}
        onChange={onDateChange}
        accentColor={accentClass.includes('blue') ? 'blue' : 'emerald'}
      />

      {extra}

      <label className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-[#0f0f0f] py-10 px-4 transition-colors duration-300 ${loading ? 'border-blue-500/30 cursor-wait' : 'border-white/10 hover:border-white/25 cursor-pointer'}`}>
        <input type="file" accept=".pdf" className="hidden" onChange={onFile} disabled={loading} />
        <span className={`material-symbols-outlined text-3xl mb-3 ${loading ? 'text-blue-500 animate-pulse' : 'text-zinc-600'}`}>upload_file</span>
        <p className="text-zinc-500 text-sm text-center font-medium">Clique ou arraste o <b>.PDF</b></p>
        {status && (
          <p className={`mt-3 text-xs text-center font-bold px-3 py-1.5 rounded-lg ${status.includes('Erro') ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
            {status}
          </p>
        )}
      </label>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UnitDashboard() {
  const { unidadeId } = useParams<{ unidadeId: string }>();
  const [unidade, setUnidade] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingestion'>('overview');

  // Faturamento upload
  const [fatData, setFatData] = useState(new Date().toISOString().split('T')[0]);
  const [fatStatus, setFatStatus] = useState('');
  const [fatLoading, setFatLoading] = useState(false);

  // Extrato upload
  const [extData, setExtData] = useState(new Date().toISOString().split('T')[0]);
  const [extBanco, setExtBanco] = useState('santander');
  const [extStatus, setExtStatus] = useState('');
  const [extLoading, setExtLoading] = useState(false);

  // Manual entry
  const [manualData, setManualData] = useState(new Date().toISOString().split('T')[0]);
  const [recebimentoDisplay, setRecebimentoDisplay] = useState('');
  const [recebimentoValor, setRecebimentoValor] = useState(0);
  const [manualLoading, setManualLoading] = useState(false);

  // AI history
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  const { data: subUnidadesData, loading: loadingStats } = useResumoSubUnidades();
  const { data: lancamentos, loading: loadingLancamentos } = useLancamentos();

  useEffect(() => {
    supabase.from('unidades').select('*').eq('id', unidadeId).single().then(({ data }) => setUnidade(data));
    fetchAiHistory();
  }, [unidadeId]);

  const fetchAiHistory = async () => {
    const { data } = await supabase
      .from('lancamentos')
      .select('*')
      .in('origem', ['pdf_import', 'extrato_bancario'])
      .eq('unidade_id', unidadeId)
      .order('created_at', { ascending: false })
      .limit(8);
    if (data) setAiHistory(data);
  };

  // ── Faturamento PDF upload ──────────────────────────────────────────────────
  const handleFatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (unidadeId) formData.append('unidade_id', unidadeId);
    setFatStatus(`Enviando ${file.name}…`);
    setFatLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/upload-pdf`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      setFatStatus('IA processando em background…');
      setTimeout(() => { setFatStatus(''); setFatLoading(false); fetchAiHistory(); }, 7000);
    } catch { setFatStatus('Erro ao conectar com a API.'); setFatLoading(false); }
    e.target.value = '';
  };

  // ── Extrato Bancário upload ─────────────────────────────────────────────────
  const handleExtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('unidade_id', unidadeId!);
    formData.append('data_referencia', extData);
    formData.append('banco', extBanco);
    setExtStatus(`Enviando ${file.name}…`);
    setExtLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/upload-extrato`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      setExtStatus('Parser de extrato processando…');
      setTimeout(() => { setExtStatus(''); setExtLoading(false); fetchAiHistory(); }, 7000);
    } catch { setExtStatus('Erro ao conectar com a API.'); setExtLoading(false); }
    e.target.value = '';
  };

  // ── Manual entry ────────────────────────────────────────────────────────────
  const handleRecebimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setRecebimentoDisplay(''); setRecebimentoValor(0); return; }
    const num = parseInt(raw, 10) / 100;
    setRecebimentoValor(num);
    setRecebimentoDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num));
  };

  const handleManualSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (recebimentoValor <= 0) { alert('Informe um valor maior que zero.'); return; }
    setManualLoading(true);
    try {
      const { error } = await supabase.from('lancamentos').insert([{
        data: manualData, unidade_id: unidadeId, tipo: 'recebimento',
        valor: recebimentoValor, origem: 'manual',
      }]);
      if (error) throw error;
      alert('Recebimento lançado!');
      setRecebimentoDisplay(''); setRecebimentoValor(0);
    } catch { alert('Erro ao salvar.'); } finally { setManualLoading(false); }
  };

  const handleDeleteAI = async (id: string) => {
    if (!window.confirm('Remover este lançamento?')) return;
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (!error) fetchAiHistory(); else alert('Erro ao remover.');
  };

  // ── Computed stats ──────────────────────────────────────────────────────────
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const searchKey = normalize(unidade?.nome || '');
  const unitStats = subUnidadesData.filter(d => normalize(d.unidade_nome).includes(searchKey));
  const totalFaturamento = unitStats.reduce((s, i) => s + Number(i.faturamento), 0);
  const totalRecebimento = unitStats.reduce((s, i) => s + Number(i.recebimento), 0);
  const totalGap = unitStats.reduce((s, i) => s + Number(i.gap), 0);
  const unitTransactions = lancamentos.filter((l: any) => l.unidade_id === unidadeId).slice(0, 10);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!unidade || loadingStats || loadingLancamentos) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Conectando…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">

      {/* Header */}
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

        <div className="flex gap-2 bg-[#0a0a0a] p-1.5 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('overview')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Visão Geral
          </button>
          <button onClick={() => setActiveTab('ingestion')} className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'ingestion' ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Lançamentos
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl flex flex-col relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full opacity-10 ${totalGap > 0 ? 'bg-rose-500' : 'bg-emerald-500 group-hover:opacity-20'}`}></div>
              <div className="flex justify-between items-start mb-10 relative z-10">
                <h3 className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Diagnóstico Atual</h3>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${totalGap > 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                  {totalGap > 0 ? 'Alerta de Fluxo' : 'Operação 100%'}
                </span>
              </div>
              <div className="space-y-8 flex-1 relative z-10">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Faturamento Bruto</p>
                  <div className="text-4xl font-black text-white tracking-tighter">{fmt(totalFaturamento)}</div>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Gap em Aberto</p>
                  <div className={`text-2xl font-bold tracking-tighter ${totalGap > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
                    {totalGap > 0 ? `- ${fmt(totalGap)}` : 'R$ 0,00'}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-emerald-500">Conversão de Caixa</span>
                    <span className="text-zinc-300">{totalFaturamento > 0 ? ((totalRecebimento / totalFaturamento) * 100).toFixed(1) : '0'}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className={`h-full rounded-full transition-all duration-1000 ${totalGap > 0 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                      style={{ width: totalFaturamento > 0 ? `${Math.min(100, (totalRecebimento / totalFaturamento) * 100)}%` : '0%' }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">Evolução do Período</h3>
              <p className="text-sm text-zinc-500 mb-6">Faturamento por sub-unidade / filial</p>
              <div className="flex-1 min-h-[260px] -ml-6">
                {unitStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={unitStats} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis dataKey="sub_unidade_nome" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fafafa' }} />
                      <Area type="monotone" dataKey="faturamento" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600">Sem dados suficientes para o gráfico.</div>
                )}
              </div>
            </div>
          </div>

          {/* Reconciliation Table */}
          <ReconciliationTable unidadeId={unidadeId!} />

          {/* Transactions */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="font-bold text-xl text-white">Últimos Lançamentos</h3>
              <p className="text-sm text-zinc-500 mt-1">Todos os registros desta unidade.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0f0f0f]">
                    {['Data', 'Operação', 'Origem', 'Valor'].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {unitTransactions.length > 0 ? unitTransactions.map((tx: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-zinc-400">{new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${tx.tipo === 'faturamento' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                          <span className="text-sm font-bold text-zinc-200 capitalize">{tx.tipo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-zinc-500 uppercase tracking-wider">
                          {tx.origem === 'pdf_import' ? 'ERP IA' : tx.origem === 'extrato_bancario' ? `Extrato ${tx.banco || ''}` : 'Manual'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold font-mono ${tx.tipo === 'faturamento' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {fmt(tx.valor)}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-zinc-600 italic">Nenhum histórico para esta unidade.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ─── Ingestion Tab ─────────────────────────────────────────────────── */
        <div className="animate-fade-in space-y-6">

          {/* Two-column upload zones */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Faturamento */}
            <UploadZone
              title="Faturamento (ERP Águia)"
              subtitle="PDF de resumo de vendas diário"
              icon="receipt_long"
              accentClass="text-blue-500"
              date={fatData}
              onDateChange={setFatData}
              onFile={handleFatUpload}
              status={fatStatus}
              loading={fatLoading}
            />

            {/* Extrato Bancário */}
            <UploadZone
              title="Extrato Bancário"
              subtitle="Santander, Safra, Caixa, Sicoob"
              icon="account_balance"
              accentClass="text-indigo-500"
              date={extData}
              onDateChange={setExtData}
              onFile={handleExtUpload}
              status={extStatus}
              loading={extLoading}
              extra={
                <div className="relative">
                  <label className="absolute left-3 -top-2 px-1 bg-[#0a0a0a] text-[10px] font-bold text-indigo-500/80 uppercase tracking-widest z-10">Banco</label>
                  <select
                    value={extBanco}
                    onChange={e => setExtBanco(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-indigo-500/20 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all appearance-none"
                  >
                    {['santander', 'safra', 'caixa', 'sicoob', 'bradesco', 'itau'].map(b => (
                      <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-zinc-500 pointer-events-none">expand_more</span>
                </div>
              }
            />
          </div>

          {/* Manual Entry */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-3 flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-rose-500 text-[20px]">keyboard_alt</span>
              <h3 className="font-bold text-white">Lançamento Manual de Caixa</h3>
            </div>
            <DatePickerInput label="Data Referência" value={manualData} onChange={setManualData} accentColor="blue" />
            <div className="relative">
              <label className="absolute left-3 -top-2 px-1 bg-[#0a0a0a] text-[10px] font-bold text-emerald-500 uppercase tracking-widest z-10">Caixa Recebido</label>
              <input type="text" value={recebimentoDisplay} onChange={handleRecebimentoChange} placeholder="R$ 0,00"
                className="w-full bg-[#0a0a0a] border border-emerald-500/30 rounded-xl p-3.5 text-lg text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 transition-all font-mono" />
            </div>
            <button disabled={manualLoading} onClick={handleManualSubmit}
              className="h-[52px] bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {manualLoading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <><span className="material-symbols-outlined text-[18px]">publish</span>Efetivar</>}
            </button>
          </div>

          {/* AI / Extrato History */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500 text-[20px]">history</span>
              <h3 className="font-bold text-white">Log de Processamentos Recentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0f0f0f]">
                    {['Data Ref.', 'Tipo', 'Origem / Banco', 'Valor (R$)', 'Ação'].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {aiHistory.length > 0 ? aiHistory.map((item, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-zinc-400">{new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white capitalize">{item.tipo}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400 capitalize">
                        {item.origem === 'extrato_bancario' ? `Extrato · ${item.banco || '—'}` : item.origem === 'pdf_import' ? 'ERP · IA' : 'Manual'}
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold font-mono ${item.tipo === 'faturamento' ? 'text-blue-400' : 'text-emerald-400'}`}>
                        {item.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDeleteAI(item.id)} className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-zinc-600">Nenhum processamento recente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
