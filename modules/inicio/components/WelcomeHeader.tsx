import React from 'react';
import { useAuthStore } from '../../../store/auth.store';

const WelcomeHeader: React.FC = () => {
  const { session } = useAuthStore();
  const userNome = session?.user?.user_metadata?.nome || 'Usuário';
  const now = new Date();
  const hour = now.getHours();

  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const dateFormatted = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-800 shadow-2xl group">
      {/* Decorative Gradients */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-indigo-500/50" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Nexus Intelligence Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">{userNome.split(' ')[0]}</span>
          </h1>
          <p className="mt-4 text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
            Seja bem-vindo ao coração operacional da Hidrocar. Aqui você visualiza a performance em tempo real e toma decisões baseadas em dados.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl self-start md:self-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status do Sistema</p>
          <div className="flex items-center gap-3 text-white">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-40" />
            </div>
            <span className="text-sm font-black uppercase tracking-tight">Core Online</span>
          </div>
          <p className="mt-4 text-[11px] font-bold text-slate-400 border-t border-white/5 pt-4 capitalize">
            {dateFormatted}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
