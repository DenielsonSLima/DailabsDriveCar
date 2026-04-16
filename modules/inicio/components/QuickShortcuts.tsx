import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search } from 'lucide-react';
import FipeConsultModal from './FipeConsultModal';

const ShortcutItem = ({ to, label, icon, color, description, onClick }: { to?: string, label: string, icon: React.ReactNode, color: string, description: string, onClick?: () => void }) => {
  const content = (
    <>
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 border border-${color}-100 flex items-center justify-center text-${color}-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{label}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{description}</p>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 group-hover:duration-500">
        <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="group w-full flex items-center gap-5 p-5 bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-500 text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={to || '#'}
      className="group flex items-center gap-5 p-5 bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-500"
    >
      {content}
    </NavLink>
  );
};

const QuickShortcuts: React.FC = () => {
  const [isFipeModalOpen, setIsFipeModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="px-1 border-l-4 border-amber-500 mb-2">
        <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Fluxo Ágil</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Atalhos para operações frequentes</p>
      </div>

      <ShortcutItem
        onClick={() => setIsFipeModalOpen(true)}
        label="Consulta Fipe"
        description="Avaliação rápida por Placa"
        color="purple"
        icon={
          <Search className="w-7 h-7" />
        }
      />

      <ShortcutItem
        to="/parceiros?action=new"
        label="Cadastrar Parceiro"
        description="Novo cliente ou fornecedor"
        color="indigo"
        icon={
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <FipeConsultModal 
        isOpen={isFipeModalOpen} 
        onClose={() => setIsFipeModalOpen(false)} 
      />
    </div>
  );
};

export default QuickShortcuts;
