import React from 'react';
import { ICombustivel } from '../combustivel.types';

interface Props {
  items: ICombustivel[];
  onEdit: (item: ICombustivel) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
}

const CombustivelList: React.FC<Props> = ({ items, onEdit, onDelete, onReactivate }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <div 
          key={item.id} 
          className={`group relative p-3 sm:p-4 rounded-[1.5rem] border flex items-center justify-between transition-all duration-300 ${
            item.ativo !== false 
              ? 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-lg' 
              : 'bg-slate-100/50 border-slate-200 opacity-60 grayscale-[0.5]'
          }`}
        >
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 pr-12 w-full">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
              item.ativo !== false ? 'bg-rose-50 text-rose-500' : 'bg-slate-200 text-slate-400'
            }`}>
               <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
            </div>
            <span className="font-bold text-slate-700 uppercase text-[10px] sm:text-xs truncate tracking-tighter leading-tight">
              {item.nome}
            </span>
          </div>
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-100 shadow-sm">
            {item.ativo !== false ? (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Inativar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
              </>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); onReactivate(item.id); }} 
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Reativar"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CombustivelList;
