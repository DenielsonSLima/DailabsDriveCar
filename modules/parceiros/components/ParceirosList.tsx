

import React from 'react';
import { IParceiro } from '../parceiros.types';
import ParceiroCard from './ParceiroCard';

interface ListProps {
  parceiros: IParceiro[];
  loading: boolean;
  onEdit: (p: IParceiro) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (p: IParceiro) => void;
}

const ParceirosList: React.FC<ListProps> = ({ parceiros, loading, onEdit, onDelete, onToggleStatus }) => {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Carregando parceiros...</p>
      </div>
    );
  }

  if (parceiros.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-200 border-dashed">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
        </div>
        <h3 className="text-slate-900 font-bold text-lg">Nenhum parceiro encontrado</h3>
        <p className="text-slate-500 text-sm mt-1">Ajuste os filtros ou cadastre um novo parceiro.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {parceiros.map((p) => (
        <ParceiroCard
          key={p.id}
          parceiro={p}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
};

export default ParceirosList;

