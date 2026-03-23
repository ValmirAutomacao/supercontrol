
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const path = location.pathname;

  const topNavClass = (target: string) => {
    return path.startsWith(target)
      ? "text-[#a78bfa] font-bold border-b-2 border-[#a78bfa] transition-colors duration-200 py-1"
      : "text-[#a1a1aa] hover:bg-[#18181b] hover:text-[#fafafa] transition-colors duration-200 px-3 py-1 rounded";
  };

  const sideNavClass = (target: string) => {
    return path === target
      ? "bg-[#18181b] text-[#a78bfa] border-l-4 border-[#a78bfa] flex items-center px-4 py-3 active:scale-95 transition-transform"
      : "text-[#a1a1aa] flex items-center px-4 py-3 hover:bg-[#18181b] hover:text-[#fafafa] border-l-4 border-transparent active:scale-95 transition-transform";
  };
  return (
    <div className="bg-background text-on-surface antialiased selection:bg-primary selection:text-on-primary min-h-screen">
      {/* TopAppBar Navigation */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#09090b] border-b border-[#27272a]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-[#fafafa] tracking-tight">GF Comércio de Gás</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-6">
            <Link className={topNavClass('/dashboard')} to="/dashboard">Dashboard</Link>
            <Link className={topNavClass('/relatorios')} to="/relatorios">Relatórios</Link>
            <Link className={topNavClass('/lancamento')} to="/lancamento">Lançamento</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[#a78bfa]">
          <button className="p-2 hover:bg-[#18181b] rounded-full transition-colors"><span className="material-symbols-outlined">notifications</span></button>
          <button className="p-2 hover:bg-[#18181b] rounded-full transition-colors"><span className="material-symbols-outlined">account_balance_wallet</span></button>
          <button className="p-2 hover:bg-[#18181b] rounded-full transition-colors"><span className="material-symbols-outlined">warning</span></button>
        </div>
      </header>

      {/* SideNavBar (Desktop Only) */}
      <aside className="fixed left-0 top-0 h-full hidden md:flex flex-col pt-20 pb-4 w-64 bg-[#0c0c0f] border-r border-[#27272a] z-40">
        <div className="px-6 mb-8">
          <h2 className="text-lg font-black text-[#a78bfa]">GF Distribuidora</h2>
          <p className="text-xs text-on-secondary-container">Unidades Operacionais</p>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          <Link className={sideNavClass('/dashboard/ilheus')} to="/dashboard/ilheus">
            <span className="material-symbols-outlined mr-3">location_on</span>
            <span className="font-geist text-sm">Ilhéus</span>
          </Link>
          <Link className={sideNavClass('/dashboard/itabuna')} to="/dashboard/itabuna">
            <span className="material-symbols-outlined mr-3">location_on</span>
            <span className="font-geist text-sm">Itabuna</span>
          </Link>
          <Link className={sideNavClass('/dashboard/itapetinga')} to="/dashboard/itapetinga">
             <span className="material-symbols-outlined mr-3">location_on</span>
             <span className="font-geist text-sm">Itapetinga</span>
          </Link>
          <Link className={sideNavClass('/dashboard/conquista')} to="/dashboard/conquista">
             <span className="material-symbols-outlined mr-3">location_on</span>
             <span className="font-geist text-sm">Vitória da Conquista</span>
          </Link>
        </nav>

        <div className="px-2 pt-4 border-t border-[#27272a] space-y-1">
          <Link className="text-[#a1a1aa] flex items-center px-4 py-3 hover:bg-[#18181b] hover:text-[#fafafa] active:scale-95 transition-transform" to="/configuracoes">
            <span className="material-symbols-outlined mr-3">settings</span>
            <span className="font-geist text-sm">Configurações</span>
          </Link>
          <Link className="text-[#a1a1aa] flex items-center px-4 py-3 hover:bg-[#18181b] hover:text-[#fafafa] active:scale-95 transition-transform" to="/suporte">
            <span className="material-symbols-outlined mr-3">help_outline</span>
            <span className="font-geist text-sm">Suporte</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="pt-24 pb-12 px-6 md:ml-64 min-h-screen">
        <Outlet />
      </main>

      {/* Contextual FAB (Dashboard Action) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  );
}
