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
    <div className="relative overflow-hidden bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm group">
      {/* Decorative Gradients */}
      <div className="hidden" />
      <div className="hidden" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-indigo-500/50" />
            <span className="text-xs font-semibold text-indigo-600 normal-case tracking-normal">Dailabs DriveCar</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight leading-tight">
            {greeting}, <span className="text-indigo-600">{userNome.split(' ')[0]}</span>
          </h1>
          <p className="mt-3 text-slate-500 text-sm  font-medium max-w-xl leading-relaxed">
            Seja bem-vindo ao coração operacional do seu negócio. Aqui você visualiza a performance em tempo real e toma decisões baseadas em dados.
          </p>

        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shrink-0 self-start md:self-center">
          <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-1">Status do Sistema</p>
          <div className="flex items-center gap-3 text-slate-700">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full " />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full opacity-0" />
            </div>
            <span className="text-sm font-semibold normal-case tracking-tight">Core Online</span>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500 border-t border-slate-200 pt-3 capitalize">
            {dateFormatted}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
