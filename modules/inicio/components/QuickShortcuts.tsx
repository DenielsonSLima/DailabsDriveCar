import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search } from 'lucide-react';
import FipeConsultModal from './FipeConsultModal';

const ShortcutItem = ({ to, label, icon, color, description, onClick }: { to?: string, label: string, icon: React.ReactNode, color: string, description: string, onClick?: () => void }) => {
  const content = (
    <>
      <div className={`w-9 h-9 shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600   transition-all duration-500`}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900 normal-case tracking-tight group-hover:text-indigo-600 transition-colors">{label}</h4>
        <p className="text-xs font-medium text-slate-500 normal-case tracking-normal mt-0.5">{description}</p>
      </div>
      <div className="ml-auto shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="dc-panel group w-full flex items-center gap-3 hover:shadow-sm hover:border-slate-300 transition-all duration-500 text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={to || '#'}
      className="dc-panel group flex items-center gap-3 hover:shadow-sm hover:border-slate-300 transition-all duration-500"
    >
      {content}
    </NavLink>
  );
};

const QuickShortcuts: React.FC = () => {
  const [isFipeModalOpen, setIsFipeModalOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="dc-section-title">Acesso rápido</h3>
        <p className="dc-section-subtitle">Atalhos para operações frequentes</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ShortcutItem
        onClick={() => setIsFipeModalOpen(true)}
        label="Consulta Fipe"
        description="Avaliação rápida por Placa"
        color="purple"
        icon={
          <Search className="w-5 h-5" />
        }
      />

      <ShortcutItem
        to="/parceiros?action=new"
        label="Cadastrar Parceiro"
        description="Novo cliente ou fornecedor"
        color="indigo"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        }
      />

      <ShortcutItem
        to="/pedidos-compra/novo"
        label="Pedido de Compra"
        description="Integrar veículo ao pátio"
        color="emerald"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />

      <ShortcutItem
        to="/pedidos-venda/novo"
        label="Pedido de Venda"
        description="Registrar saída de veículo"
        color="amber"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      </div>

      <FipeConsultModal 
        isOpen={isFipeModalOpen} 
        onClose={() => setIsFipeModalOpen(false)} 
      />
    </div>
  );
};

export default QuickShortcuts;
