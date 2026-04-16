
import React from 'react';
import { IMontadora } from '../montadoras.types';

interface CardProps {
  montadora: IMontadora;
  onEdit: (m: IMontadora) => void;
  onDelete: (id: string) => void;
  onReactivate?: (id: string) => void;
}

const MontadoraCard: React.FC<CardProps> = ({ montadora, onEdit, onDelete, onReactivate }) => {
  const isInactive = montadora.ativo === false;

  return (
    <div className={`group relative bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 flex flex-col items-center ${isInactive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      {/* Ações flutuantes - Adicionado z-30 para nunca ficar atrás da logo */}
      <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 -translate-y-2 z-30">
        {!isInactive ? (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(montadora); }}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(montadora.id); }}
              className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
              title="Inativar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          </>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onReactivate?.(montadora.id); }}
            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            title="Reativar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Logo Display - Adicionado z-10 para ficar abaixo das ações */}
      <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 p-4 group-hover:scale-105 transition-transform duration-500 overflow-hidden relative z-10">
        {montadora.logo_url ? (
          <img src={montadora.logo_url} alt={montadora.nome} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-slate-300">
             <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Info */}
      <div className="text-center w-full z-10">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">
          {montadora.nome}
        </h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 bg-slate-50 inline-block px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
          Fabricante
        </p>
      </div>

      {/* Background Accent Animation */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:w-3/4 z-0"></div>
    </div>
  );
};

export default MontadoraCard;
