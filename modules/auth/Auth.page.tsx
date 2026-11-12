import { AppBrand, BrandSymbol } from '../../components/AppBrand';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './auth.service';
import LoginForm from './components/LoginForm';
import { useAuthStore } from '../../store/auth.store';

// Imagens de fundo do login — ficam em public/login-bg/
const backgroundImages = [
  '/login-bg/bg-pop-1.jpg',
];

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<{ title: string, message: string } | null>(null);
  const [success, setSuccess] = useState<{ title: string, message: string } | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Redirecionamento automático baseado no estado da sessão
  // Isso garante que só saímos da tela de login quando o App.tsx já reconheceu a sessão
  useEffect(() => {
    if (session) {
      navigate(window.innerWidth < 768 ? '/caixa' : '/inicio', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    // Slideshow do background
    if (backgroundImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, []);


  const handleLogin = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await AuthService.signIn(email, pass);
      // O redirecionamento agora é feito pelo useEffect monitorando o estado da session
    } catch (err: any) {
      console.error('Erro de login:', err);
      let message = 'Verifique seu e-mail e senha e tente novamente.';
      let title = 'Credenciais Inválidas';

      if (err.message?.includes('Email not confirmed')) {
        title = 'E-mail não confirmado';
        message = 'Por favor, verifique sua caixa de entrada para confirmar seu acesso.';
      } else if (err.message?.includes('Invalid login credentials')) {
        title = 'Acesso Negado';
        message = 'Usuário ou senha incorretos. Tente novamente.';
      }

      setError({ title, message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError({
        title: 'Informe o e-mail',
        message: 'Digite seu e-mail de acesso antes de solicitar a troca de senha.',
      });
      return;
    }

    setResetLoading(true);
    try {
      await AuthService.sendPasswordReset(email);
      setSuccess({
        title: 'E-mail enviado',
        message: 'Enviamos um link seguro para redefinir sua senha pelo Supabase.',
      });
    } catch (err: any) {
      console.error('Erro ao solicitar reset de senha:', err);
      setError({
        title: 'Não foi possível enviar',
        message: err.message || 'Tente novamente em alguns instantes.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await AuthService.signInWithGoogle();
    } catch (err: any) {
      console.error('Erro no login com Google:', err);
      setError({
        title: 'Google indisponível',
        message: err.message || 'Não foi possível iniciar o login com Google agora.',
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div data-drivecar-ui className="arkhen-auth min-h-dvh bg-[#080c12] text-slate-100 relative isolate overflow-hidden flex items-center py-8 sm:py-12">
      <style>{`
        .arkhen-auth { color-scheme: dark; }
        .arkhen-auth form label, .arkhen-auth form label span { color: #cbd5e1; }
        .arkhen-auth form input:not([type="checkbox"]) { height: 48px; color: #f8fafc; background: #0d131d; border-color: #334155; box-shadow: none; }
        .arkhen-auth form input:not([type="checkbox"]):focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgb(148 163 184 / .12); }
        .arkhen-auth form input::placeholder { color: #64748b; }
        .arkhen-auth form input[type="checkbox"] { accent-color: #cbd5e1; }
        .arkhen-auth form button[type="submit"] { min-height: 48px; color: #111827; background: #e2e8f0; font-weight: 600; box-shadow: 0 3px 18px rgb(0 0 0 / .2); }
        .arkhen-auth form button[type="submit"]:hover { background: #f8fafc; }
        .arkhen-auth form button[type="submit"] > div { border-color: #94a3b8; border-top-color: #111827; }
        .arkhen-auth form button[type="button"] { color: #cbd5e1; }
        .arkhen-auth form button[type="button"]:hover { color: #fff; }
        .arkhen-auth form button[type="button"].w-full { min-height: 48px; background: #151d28; border-color: #334155; }
        .arkhen-auth form button[type="button"].w-full:hover { background: #1e293b; }
        .arkhen-auth form .h-px { background: #263244; }
        .arkhen-auth :where(button,input):focus-visible { outline-color: #cbd5e1; }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
        {backgroundImages.map((img, index) => (
          <div key={img} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}>
            <img src={img} alt="" className="w-full h-full object-cover opacity-[0.12] grayscale" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080c12] via-[#080c12]/90 to-[#101a28]/90" />
        <div className="absolute -left-40 top-1/4 h-[560px] w-[560px] rounded-full border border-white/[0.04]" />
        <div className="absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full border border-white/[0.04]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <section className="hidden min-h-[560px] flex-col justify-between lg:flex" aria-label="Arkhen Drive Car">
          <AppBrand dark />
          <div className="py-16">
            <div className="mb-8"><BrandSymbol className="h-20 w-20" /></div>
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Gestão automotiva</p>
            <h2 className="max-w-lg text-5xl font-medium leading-[1.12] tracking-tight text-slate-100" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Sua operação.<br /><span className="text-slate-400">Uma nova direção.</span>
            </h2>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-400">Estoque, vendas e finanças em um ambiente feito para decisões claras.</p>
          </div>
          <div className="flex gap-6 border-t border-white/10 pt-5 text-xs text-slate-400">
            <span>Estoque</span><span>Operação</span><span>Financeiro</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#111822]/95 p-5 shadow-2xl shadow-black/30 sm:p-8" aria-label="Acesso ao sistema">
          <div className="mb-8 flex items-center justify-between gap-3">
            <AppBrand dark />
            <span className="rounded-full border border-slate-600/60 px-2.5 py-1 text-[11px] font-medium text-slate-400">Acesso restrito</span>
          </div>
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Bem-vindo de volta</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Entre para continuar no Arkhen Drive Car.</p>
          </div>
          {error && (
            <div role="alert" className="mb-6 p-4 bg-rose-950/40 border border-rose-400/25 text-rose-200 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-in shake duration-300">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold normal-case tracking-normal mb-0.5">{error.title}</p>
                <p className="text-xs leading-tight opacity-90">{error.message}</p>
              </div>
            </div>
          )}

          {success && (
            <div role="status" className="mb-6 p-4 bg-emerald-950/40 border border-emerald-400/25 text-emerald-200 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-in fade-in duration-300">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-xs font-semibold normal-case tracking-normal mb-0.5">{success.title}</p>
                <p className="text-xs leading-tight opacity-90">{success.message}</p>
              </div>
            </div>
          )}

          <LoginForm
            onSubmit={handleLogin}
            onForgotPassword={handleForgotPassword}
            onGoogleLogin={handleGoogleLogin}
            isLoading={loading}
            isResetLoading={resetLoading}
            isGoogleLoading={googleLoading}
          />


          <p className="mt-7 border-t border-white/[0.07] pt-5 text-center text-xs leading-5 text-slate-500">Arkhen Drive Car · Gestão integrada</p>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
