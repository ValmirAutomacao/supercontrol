import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNome, setNewNome] = useState('');

  const fetchUnidades = async () => {
    setLoading(true);
    const { data } = await supabase.from('unidades').select('*').order('created_at', { ascending: true });
    if (data) setUnidades(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  const handleCreateUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim()) return;
    
    // Simplification for settings: assuming franchise ID is fixed or generated properly
    // Real-world would have user select franquia_id.
    const { data: franquias } = await supabase.from('franquias').select('id').limit(1);
    if (!franquias || franquias.length === 0) {
      alert("Nenhuma franquia base encontrada. Crie a franquia primeiro.");
      return;
    }

    const franquia_id = franquias[0].id;

    const { error } = await supabase.from('unidades').insert([{
      nome: newNome,
      franquia_id: franquia_id
    }]);

    if (!error) {
      setNewNome('');
      fetchUnidades();
    } else {
      alert("Erro ao criar unidade: " + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-10">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span className="text-[10px] font-bold tracking-widest uppercase">Global Settings</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Configurações Base</h1>
          <p className="text-zinc-500 font-medium">Gerenciamento central da arquitetura de unidades e acessos da franquia.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Unidades Management */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500">storefront</span>
            Unidades Operacionais
          </h3>
          <p className="text-sm text-zinc-500 mb-8">Adicione ou remova as unidades que formam a rede de vendas.</p>

          <form onSubmit={handleCreateUnidade} className="flex gap-3 mb-8">
            <input 
              type="text" 
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              placeholder="Nome da Nova Unidade"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-zinc-600"
            />
            <button type="submit" className="px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Registrar
            </button>
          </form>

          {loading ? (
             <div className="animate-pulse space-y-3">
               {[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl"></div>)}
             </div>
          ) : (
            <div className="space-y-3">
              {unidades.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-zinc-500 text-[20px]">store</span>
                     <span className="font-bold text-zinc-200">{u.nome}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-600">{u.id.substring(0,8)}...</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Configs / Health */}
        <div className="space-y-8">
          <div className="bg-[#100a0a] border border-rose-500/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-rose-500 mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined">security</span>
              Segurança & Acessos
            </h3>
            <p className="text-sm text-zinc-500 mb-6">Em breve o sistema de RBAC (Role-Based Access Control) estará disponível para vincular gerentes a unidades específicas.</p>
            <button disabled className="w-full py-3 bg-rose-500/10 text-rose-500/50 font-bold rounded-xl border border-rose-500/10 cursor-not-allowed">
              Módulo em Desenvolvimento
            </button>
          </div>
          
          <div className="bg-[#0a0a1a] border border-indigo-500/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-indigo-400 mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined">webhook</span>
              API & Integrações
            </h3>
            <p className="text-sm text-zinc-500 mb-6">Chaves de API para conexão com sistemas de terceiros (ERP UazAPI, Webhooks).</p>
            <div className="w-full p-4 bg-black/50 border border-white/5 rounded-xl flex items-center justify-between font-mono text-xs text-zinc-500">
              sk_test_51Nx...4H2
              <span className="material-symbols-outlined text-zinc-600 cursor-pointer hover:text-white transition-colors">content_copy</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
