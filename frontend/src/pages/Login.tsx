import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
      } else {
        alert("Conta criada com sucesso com sucesso! Acesse abaixo com suas credenciais.");
        setIsSignup(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-4 selection:bg-primary selection:text-on-primary font-body">
      {/* Ambient Background Texture */}
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/5 blur-[120px] pointer-events-none"></div>
      
      <main className="w-full max-w-md z-10">
        {/* Brand Identity Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-surface-container border border-outline-variant mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">local_gas_station</span>
          </div>
          <h1 className="text-lg font-black text-on-surface tracking-tighter mb-1">GF Comércio de Gás</h1>
          <p className="text-on-surface-variant text-sm tracking-tight font-medium">Bem-vindo de volta</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleAuth}>
            {error && (
              <div className="bg-error/10 border border-error/50 text-error px-4 py-2 rounded text-sm text-center font-medium">
                {error}
              </div>
            )}
            {/* Email Input Group */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="email">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">alternate_email</span>
                </div>
                <input 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-on-surface placeholder:text-secondary-fixed-dim focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm" 
                  id="email" 
                  placeholder="seu@email.com.br" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input Group */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Senha</label>
                <a className="text-[11px] font-bold text-primary hover:underline transition-all" href="#">Esqueceu a senha?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input 
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-on-surface placeholder:text-secondary-fixed-dim focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Primary Action */}
            <button 
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/10 disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Processando...' : (isSignup ? 'Criar Conta' : 'Acessar Sistema')}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-container px-2 text-on-surface-variant font-medium">Ou continue com</span>
              </div>
            </div>

            {/* Social Login */}
            <button className="w-full bg-transparent border border-outline-variant hover:bg-surface-container-high text-on-surface font-bold py-3 rounded-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]" type="button">
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7s-CBqToa553v_PkGc_GZKgTvBndBA30jwDUyPyLpAenCHXy82Sy5nt_8O9uHibO47a42VUURXY7wq7vaIkn9oTq_TyrLPTLvb-K96C9gQ3M3rU_MGb2TavLIdRtyR039CMsL9zrqorO2JeaM3SwK2VBg1t-hRfOaF03jBu0xJLw7G7bNGL1bT2nA3Zhnecwc6MRIZ-vSMfGdn2FlstyNutnSLWyk5FOTpSwbDUM3-sQPqInE7t4yvd4BkWTpDCFDvJChSCRcW1Sw"/>
              <span>Continuar com Google</span>
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-on-surface-variant">
            {isSignup ? 'Já tem uma conta?' : 'Não tem uma conta?'} 
            <button 
              type="button"
              className="text-primary font-bold hover:underline ml-1 transition-all" 
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup ? 'Entrar agora' : 'Criar agora'}
            </button>
          </p>
          <div className="flex items-center justify-center gap-6 opacity-40">
            <span className="text-[10px] uppercase tracking-widest font-bold">Privacidade</span>
            <span className="text-[10px] uppercase tracking-widest font-bold">Termos</span>
            <span className="text-[10px] uppercase tracking-widest font-bold">Ajuda</span>
          </div>
        </div>
      </main>

      {/* Support Bubble */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-surface-container border border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95 shadow-xl">
        <span className="material-symbols-outlined">support_agent</span>
      </button>
    </div>
  );
}
