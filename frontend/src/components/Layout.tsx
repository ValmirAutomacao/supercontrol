import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const location = useLocation();
  const path = location.pathname;
  const [unidades, setUnidades] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('unidades').select('*').order('nome').then(({ data }) => {
      if (data) setUnidades(data);
    });
  }, []);

  const navItemClass = (target: string, exact: boolean = false) => {
    const isActive = exact ? path === target : path.startsWith(target);
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600/10 text-blue-500 shadow-sm shadow-blue-500/5' 
        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
    }`;
  };

  return (
    <div className="flex h-screen bg-[#030303] text-zinc-100 font-sans overflow-hidden antialiased selection:bg-blue-500/30">
      
      {/* Sidebar - Premium Dark Glass */}
      <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-[#080808] flex flex-col h-full relative z-20">
        
        {/* Brand Area */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined text-white text-lg">local_fire_department</span>
            </div>
            <div>
              <h1 className="font-bold text-zinc-100 tracking-tight leading-none">SuperControl</h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">GF Network</p>
            </div>
          </div>
        </div>

        {/* Scrollable Nav Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
          
          {/* Section: Overview */}
          <div>
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-600 mb-3">Visão Geral</p>
            <nav className="space-y-1">
              <Link to="/dashboard" className={navItemClass('/dashboard', true)}>
                <span className="material-symbols-outlined text-[20px]">donut_small</span>
                Global Dashboard
              </Link>
              <Link to="/relatorios" className={navItemClass('/relatorios')}>
                <span className="material-symbols-outlined text-[20px]">analytics</span>
                Relatórios
              </Link>
            </nav>
          </div>

          {/* Section: Operacional - Dynamic from DB */}
          <div>
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">Unidades</p>
              <div className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center cursor-pointer text-zinc-500 transition-colors">
                <span className="material-symbols-outlined text-[14px]">add</span>
              </div>
            </div>
            <nav className="space-y-1">
              {unidades.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-600 italic">Carregando unidades...</div>
              ) : (
                unidades.map(u => (
                  <Link key={u.id} to={`/dashboard/${u.id}`} className={navItemClass(`/dashboard/${u.id}`)}>
                    <span className="material-symbols-outlined text-[18px] opacity-70">storefront</span>
                    <span className="truncate">{u.nome}</span>
                  </Link>
                ))
              )}
            </nav>
          </div>

          {/* Removed Ingestion section since it is embedded inside Units now */}

        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5">
          <Link to="/configuracoes" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-zinc-400">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-200 truncate">Valmir Automacao</p>
              <p className="text-xs text-zinc-500 truncate">Administrador</p>
            </div>
            <span className="material-symbols-outlined text-zinc-600 text-sm">settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Navbar Contextual */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 shrink-0 sticky top-0 bg-[#030303]/80 backdrop-blur-xl z-10">
          <div className="flex items-center text-sm font-medium text-zinc-400">
            <span className="material-symbols-outlined text-[18px] mr-2">home</span>
            <span className="mx-2 text-zinc-700">/</span>
            <span className="text-zinc-200 capitalize">
              {path === '/' ? 'Dashboard' : path.split('/').filter(Boolean).join(' / ').replace(/-/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Buscar (Ctrl+K)" 
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-zinc-200 placeholder-zinc-600"
              />
            </div>
            <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
