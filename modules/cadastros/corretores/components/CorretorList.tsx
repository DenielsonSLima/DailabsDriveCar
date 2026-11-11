
import React from 'react';
import { ICorretor } from '../corretores.types';

interface Props {
  items: ICorretor[];
  onEdit: (item: ICorretor) => void;
  onDelete: (id: string) => void;
}

const CorretorList: React.FC<Props> = ({ items, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map(item => (
        <div key={item.id} className={`group relative bg-white p-6 rounded-2xl border border-slate-100 flex flex-col hover:border-indigo-200 hover:shadow-sm transition-all duration-200 ${!item.ativo ? 'opacity-60 grayscale-[0.8]' : ''}`}>
          
          <div className="flex items-center justify-between mb-6">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold shadow-sm ${
               item.ativo ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
             }`}>
                {item.nome.charAt(0)}{item.sobrenome?.charAt(0)}
             </div>
             <div className={`px-2 py-1 rounded-lg text-xs font-semibold normal-case tracking-normal ${
               item.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
             }`}>
               {item.ativo ? 'Ativo' : 'Inativo'}
             </div>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 text-lg leading-tight mb-1 truncate">
              {item.nome} {item.sobrenome}
            </h3>
            <p className="text-xs text-slate-500 font-medium normal-case tracking-normal mb-4">
              Corretor de Vendas
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100/50">
               <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  <span className="text-xs font-mono text-slate-600">{item.cpf || 'CPF não informado'}</span>
               </div>
               <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <span className="text-xs font-medium text-slate-600">{item.telefone || 'Sem telefone'}</span>
               </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-1 mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Excluir"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CorretorList;
