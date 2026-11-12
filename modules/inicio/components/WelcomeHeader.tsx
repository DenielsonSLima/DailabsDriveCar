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
    <header className="dc-page-header gap-4">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-slate-500">Visão geral · Arkhen Drive Car</p>
        <h1 className="dc-page-title">{greeting}, {userNome.split(' ')[0]}</h1>
        <p className="dc-page-subtitle">Estoque, vendas e resultados em um só lugar.</p>
      </div>
      <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600 md:self-center">
        <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
        <span className="capitalize">{dateFormatted}</span>
      </div>
    </header>
  );
};

export default WelcomeHeader;
