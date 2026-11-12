
import React from 'react';
import { ISocio } from '../socios.types';

interface ListSociosProps {
  socios: ISocio[];
  onEdit: (socio: ISocio) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const ListSocios: React.FC<ListSociosProps> = ({ socios, onEdit, onDelete, onToggleStatus }) => {
  if (socios.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
        </div>
        <h3 className="text-slate-900 font-semibold text-lg">Quadro vazio</h3>
        <p className="text-slate-500 text-sm mt-1">Adicione os investidores para vincular aos veículos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {socios.map((socio) => (
        <div key={socio.id} className="dc-panel hover:shadow-sm transition-all group relative hover:translate-y-0 duration-200">
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-semibold shadow-sm">
                {socio.nome.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900 leading-tight">{socio.nome}</h4>
                <p className="text-xs text-slate-500 font-mono mt-1 tracking-wide">{socio.cpf}</p>
              </div>
            </div>
            
            <div className={`w-2.5 h-2.5 rounded-full ${socio.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`} title={socio.ativo ? 'Ativo' : 'Inativo'}></div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
             <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span className="text-xs font-medium normal-case tracking-normal">Contato</span>
             </div>
             <p className="text-sm font-semibold text-slate-800 ml-6">{socio.telefone || 'Não informado'}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
             <button 
                onClick={() => onToggleStatus(socio.id!)}
                className={`text-xs font-semibold normal-case tracking-normal px-3 py-1.5 rounded-lg transition-colors ${socio.ativo ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
             >
                {socio.ativo ? 'Habilitado' : 'Desabilitado'}
             </button>

             <div className="flex space-x-1">
               <button onClick={() => onEdit(socio)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Editar">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => onDelete(socio.id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListSocios;
