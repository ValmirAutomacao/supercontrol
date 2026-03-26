import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useKpiUnidade } from '../hooks/useMetrics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DatePickerInput from '../components/DatePickerInput';

// ─── Bank config (display name + color) ──────────────────────────────────────
const BANKS: { key: string; label: string; color: string }[] = [
  { key: 'recebido_santander', label: 'Santander', color: 'text-red-400' },
  { key: 'recebido_safra',     label: 'Safra',     color: 'text-yellow-400' },
  { key: 'recebido_caixa',     label: 'Caixa',     color: 'text-blue-400' },
  { key: 'recebido_sicoob',    label: 'Sicoob',    color: 'text-green-400' },
  { key: 'recebido_bradesco',  label: 'Bradesco',  color: 'text-orange-400' },
  { key: 'recebido_itau',      label: 'Itaú',      color: 'text-amber-400' },
  { key: 'recebido_manual',    label: 'Manual',    color: 'text-zinc-300' },
  { key: 'recebido_outros',    label: 'Cartões / IA', color: 'text-indigo-300' },
];

// ─── Reconciliation sub-component ────────────────────────────────────────────
function ReconciliationTable({ unidadeId }: { unidadeId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('vw_conciliacao')
      .select('*')
      .eq('unidade_id', unidadeId)
      .order('data', { ascending: true }) // Oldest first for accumulation
      .limit(60)
      .then(({ data }) => {
        if (data) {
          // Process accumulation
          let accFat = 0;
          let accRec = 0;
          const processed = data.map(r => {
            accFat += Number(r.total_faturado || 0);
            accRec += Number(r.total_recebido || 0);
            return {
              ...r,
              acc_fat: accFat,
              acc_rec: accRec,
              acc_gap: accRec - accFat, // Matching Excel: Result = Rec - Fat (Positive = Surplus)
            };
          });
          setRows(processed);
        }
        setLoading(false);
      });
  }, [unidadeId]);

  // Only show bank columns that have at least one non-zero value
  const visibleBanks = BANKS.filter(b => rows.some(r => Number(r[b.key]) > 0));

  const fmt = (v: number) =>
    v !== 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
  
  const fmtFull = (v: number) =>
    `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;


  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden mt-6">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-indigo-500 text-[20px]">balance</span>
          <div>
            <h3 className="font-bold text-white">Conciliação Bancária</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Visão detalhada e acumulada (Baseado em Águia.xlsx)</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px] border-collapse">
          <thead>
            {/* Super Headers */}
            <tr className="bg-[#080808] border-b border-white/5">
              <th className="px-5 py-2"></th>
              <th colSpan={2} className="px-5 py-2 text-[9px] font-black text-blue-400 text-center uppercase tracking-widest border-x border-white/5 bg-blue-500/5">Faturamentos (ERP)</th>
              <th colSpan={visibleBanks.length + 2} className="px-5 py-2 text-[9px] font-black text-emerald-400 text-center uppercase tracking-widest border-x border-white/5 bg-emerald-500/5">Recebimentos (Bancos)</th>
              <th className="px-5 py-2 text-[9px] font-black text-rose-400 text-center uppercase tracking-widest bg-rose-500/5">Resultado</th>
            </tr>
            <tr className="bg-[#0f0f0f]">
              <th className="px-5 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase sticky left-0 bg-[#0f0f0f] z-10 border-b border-white/5">Data</th>
              
              <th className="px-5 py-4 text-[10px] font-black text-blue-500/80 tracking-widest uppercase text-right border-l border-white/5 border-b border-white/5">Dia</th>
              <th className="px-5 py-4 text-[10px] font-black text-blue-500/60 tracking-widest uppercase text-right border-b border-white/5">Acumulado</th>
              
              {visibleBanks.map(b => (
                <th key={b.key} className={`px-5 py-4 text-[10px] font-black tracking-widest uppercase text-right ${b.color} opacity-70 border-b border-white/5 border-l border-white/5`}>
                  {b.label}
                </th>
              ))}
              
              <th className="px-5 py-4 text-[10px] font-black text-emerald-500/80 tracking-widest uppercase text-right border-l border-white/5 border-b border-white/5">Dia</th>
              <th className="px-5 py-4 text-[10px] font-black text-emerald-500/60 tracking-widest uppercase text-right border-b border-white/5">Acumulado</th>
              
              <th className="px-5 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right border-l border-white/5 border-b border-white/5">Gap Acum.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={15} className="py-20 text-center text-zinc-600 text-sm">Engine carregando dados históricos...</td></tr>
            ) : rows.length > 0 ? [...rows].reverse().map((r) => {
              // We reverse for display (newest on top) but keep the accumulation logic from oldest
              const gapAcc = Number(r.acc_gap) || 0;
              const isOk = gapAcc >= 0;
              return (
                <tr key={r.data} className={`transition-colors hover:bg-white/5 ${!isOk ? 'bg-rose-500/[0.03]' : ''}`}>
                  <td className="px-5 py-4 font-mono text-sm text-zinc-400 sticky left-0 bg-transparent">
                    {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  
                  <td className="px-5 py-4 text-sm font-bold text-blue-400 text-right font-mono border-l border-white/5 italic opacity-80">
                    {fmtFull(r.total_faturado)}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-blue-300 text-right font-mono">
                    {fmtFull(r.acc_fat)}
                  </td>
                  
                  {visibleBanks.map(b => (
                    <td key={b.key} className={`px-5 py-4 text-sm text-right font-mono border-l border-white/5 ${Number(r[b.key]) > 0 ? `font-bold ${b.color}` : 'text-zinc-700'}`}>
                      {fmt(Number(r[b.key]))}
                    </td>
                  ))}
                  
                  <td className="px-5 py-4 text-sm font-bold text-emerald-400 text-right font-mono border-l border-white/5 italic opacity-80">
                    {fmtFull(r.total_recebido)}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-300 text-right font-mono">
                    {fmtFull(r.acc_rec)}
                  </td>
                  
                  <td className={`px-5 py-4 text-sm font-black text-right font-mono border-l border-white/5 ${gapAcc < 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                    {gapAcc !== 0 ? `${gapAcc > 0 ? '+' : ''}${fmtFull(gapAcc)}` : 'R$ 0,00'}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={15} className="px-6 py-12 text-center text-sm text-zinc-600 italic">
                  Nenhum dado para conciliar. Suba o Faturamento e os Extratos Bancários para gerar o acumulado.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-[#0f0f0f] border-t-2 border-white/10">
                <td className="px-5 py-5 text-[11px] font-black text-zinc-400 uppercase tracking-wider sticky left-0 bg-[#0f0f0f]">Total No Período</td>
                
                <td colSpan={2} className="px-5 py-5 text-sm font-black text-blue-300 text-right font-mono">
                  {fmtFull(rows.reduce((s, r) => s + Number(r.total_faturado), 0))}
                </td>
                
                {visibleBanks.map(b => (
                  <td key={b.key} className={`px-5 py-5 text-sm font-black text-right font-mono border-l border-white/5 ${b.color}`}>
                    {fmtFull(rows.reduce((s, r) => s + Number(r[b.key] || 0), 0))}
                  </td>
                ))}
                
                <td colSpan={2} className="px-5 py-5 text-sm font-black text-emerald-300 text-right font-mono border-l border-white/5">
                  {fmtFull(rows.reduce((s, r) => s + Number(r.total_recebido), 0))}
                </td>
                
                <td className={`px-5 py-5 text-md font-black text-right font-mono border-l border-white/5 ${rows[rows.length-1].acc_gap < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {fmtFull(rows[rows.length-1].acc_gap)}
                </td>
              </tr>
            </tfoot>
          )}
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

  // Lancamentos list (for the overview CRUD table)
  const [allLancamentos, setAllLancamentos] = useState<any[]>([]);
  const [loadingLanc, setLoadingLanc] = useState(false);

  // Edit modal state
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editData, setEditData] = useState('');
  const [editValorDisplay, setEditValorDisplay] = useState('');
  const [editValor, setEditValor] = useState(0);
  const [editTipo, setEditTipo] = useState<'faturamento'|'recebimento'>('faturamento');
  const [editSaving, setEditSaving] = useState(false);


  const { fat: totalFaturamento, rec: totalRecebimento, gap: totalGap } = useKpiUnidade(unidadeId);

  const unitStats = allLancamentos.reduce((acc: any[], curr: any) => {
    if (curr.tipo !== 'faturamento') return acc;
    const subName = curr.sub_unidade_nome || 'Geral';
    const existing = acc.find(a => a.sub_unidade_nome === subName);
    if (existing) {
      existing.faturamento += Number(curr.valor);
    } else {
      acc.push({ sub_unidade_nome: subName, faturamento: Number(curr.valor) });
    }
    return acc;
  }, []);

  const fetchLancamentos = async () => {
    setLoadingLanc(true);
    const { data } = await supabase
      .from('lancamentos')
      .select('*')
      .eq('unidade_id', unidadeId)
      .order('data', { ascending: false })
      .limit(50);
    if (data) setAllLancamentos(data);
    setLoadingLanc(false);
  };

  useEffect(() => {
    supabase.from('unidades').select('*').eq('id', unidadeId).single().then(({ data }) => setUnidade(data));
    fetchLancamentos();
  }, [unidadeId]);

  // Open edit modal
  const openEdit = (item: any) => {
    setEditItem(item);
    setEditData(item.data);
    setEditTipo(item.tipo);
    setEditValor(item.valor);
    setEditValorDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor));
  };

  const handleEditValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setEditValorDisplay(''); setEditValor(0); return; }
    const num = parseInt(raw, 10) / 100;
    setEditValor(num);
    setEditValorDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num));
  };

  const handleEditSave = async () => {
    if (!editItem || editValor <= 0) return;
    setEditSaving(true);
    const { error } = await supabase.from('lancamentos').update({
      data: editData, valor: editValor, tipo: editTipo,
    }).eq('id', editItem.id);
    setEditSaving(false);
    if (error) { alert('Erro ao salvar alterações.'); return; }
    setEditItem(null);
    fetchLancamentos();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este lançamento permanentemente?')) return;
    const { error } = await supabase.from('lancamentos').delete().eq('id', id);
    if (!error) fetchLancamentos(); else alert('Erro ao excluir.');
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
      setTimeout(() => { setFatStatus(''); setFatLoading(false); fetchLancamentos(); }, 7000);
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
      setTimeout(() => { setExtStatus(''); setExtLoading(false); fetchLancamentos(); }, 7000);
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
    if (!error) fetchLancamentos(); else alert('Erro ao remover.');
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!unidade || loadingLanc) {
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

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl text-white">Editar Lançamento</h2>
              <button onClick={() => setEditItem(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-zinc-400">close</span>
              </button>
            </div>

            {/* Tipo */}
            <div className="flex gap-2">
              {(['faturamento', 'recebimento'] as const).map(t => (
                <button key={t} onClick={() => setEditTipo(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all capitalize ${editTipo === t ? (t === 'faturamento' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/20'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Data */}
            <DatePickerInput label="Data" value={editData} onChange={setEditData} accentColor="blue" />

            {/* Valor */}
            <div className="relative">
              <label className="absolute left-3 -top-2 px-1 bg-[#111] text-[10px] font-bold text-emerald-500 uppercase tracking-widest z-10">Valor</label>
              <input type="text" value={editValorDisplay} onChange={handleEditValorChange} placeholder="R$ 0,00"
                className="w-full bg-[#0a0a0a] border border-emerald-500/30 rounded-xl p-3.5 text-lg text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 transition-all font-mono" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditItem(null)} className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {editSaving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <><span className="material-symbols-outlined text-[16px]">check</span>Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Lançamentos CRUD Table */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl text-white">Lançamentos</h3>
                <p className="text-sm text-zinc-500 mt-1">{allLancamentos.length} registro(s) — clique em Editar para corrigir</p>
              </div>
              <button onClick={fetchLancamentos} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px] text-zinc-400">refresh</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0f0f0f]">
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Data</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Tipo</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase">Origem</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-right">Valor</th>
                    <th className="px-5 py-4 text-[10px] font-black text-zinc-500 tracking-widest uppercase text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingLanc ? (
                    <tr><td colSpan={5} className="py-10 text-center text-zinc-600 text-sm">Carregando...</td></tr>
                  ) : allLancamentos.length > 0 ? allLancamentos.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 font-mono text-sm text-zinc-400">
                        {new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${
                          tx.tipo === 'faturamento'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tx.tipo === 'faturamento' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                          {tx.tipo}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-zinc-500 uppercase tracking-wider">
                          {tx.origem === 'pdf_import' ? 'ERP · IA'
                            : tx.origem === 'extrato_bancario' ? `Extrato · ${tx.banco || '—'}`
                            : 'Manual'}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-sm font-bold font-mono text-right ${
                        tx.tipo === 'faturamento' ? 'text-blue-400' : 'text-emerald-400'
                      }`}>
                        {fmt(tx.valor)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(tx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 text-zinc-500 text-xs font-bold transition-all border border-transparent hover:border-blue-500/20">
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(tx.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-500 text-xs font-bold transition-all border border-transparent hover:border-rose-500/20">
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-zinc-600 italic">Nenhum lançamento ainda. Use a aba Lançamentos para adicionar.</td></tr>
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
                  {allLancamentos.filter((x: any) => ['pdf_import','extrato_bancario'].includes(x.origem)).slice(0,8).map((item: any, i: number) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
