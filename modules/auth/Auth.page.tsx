
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
    <div data-drivecar-ui className="min-h-dvh bg-slate-50 text-slate-800 flex items-center justify-center relative overflow-hidden font-['Inter'] py-8">
      {/* Background Immersive with Crossfade */}
      <div aria-hidden="true" className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none">
        {backgroundImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={img}
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-50/80"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50/50"></div>
          </div>
        ))}
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md px-5 sm:px-6">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-3 shadow-sm border border-slate-200 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-transparent"></div>
            <img
              src="/logos/dailabs_logo.png"
              alt="Dailabs DriveCar"
              className="w-full h-full object-contain drop-shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `
                  <svg class="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                `;
              }}
            />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2 text-center">
            Dailabs <span className="text-indigo-600">DriveCar</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-normal normal-case mb-4">Sistema de Gestão Integrado</p>
          <div className="inline-flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            <span className="text-xs font-semibold text-slate-600 normal-case tracking-normal">Acesso Restrito</span>
          </div>
        </div>

        {/* Login Container */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 shadow-sm relative overflow-hidden">

          {/* Shine effect */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white/20 blur-3xl rounded-full pointer-events-none"></div>

          {error && (
            <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-in shake duration-300">
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
            <div role="status" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start space-x-3 backdrop-blur-sm animate-in fade-in duration-300">
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

          {/* Link para site público removido pois o sistema é restrito */}
        </div>

        {/* Developer Footer */}
        <div className="mt-7 flex items-center justify-center gap-3">
          {/* Logo */}
          <div className="h-8 w-8 flex items-center justify-center">
            <img
              src="/logos/dailabs_logo.png"
              alt="Dailabs"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Text */}
          <div className="flex flex-col items-start leading-none text-slate-500">
            <span className="text-xl font-semibold tracking-tight">DAILABS</span>
            <span className="text-xs font-medium tracking-normal normal-case mt-1">Creative AI & Softwares</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
