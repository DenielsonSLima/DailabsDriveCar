
import React from 'react';

interface Props {
  id?: string;
  isSaving: boolean;
  isLocked: boolean;
  onBack: () => void;
  onSave: () => void;
}

const FormCardHeader: React.FC<Props> = ({ id, isSaving, isLocked, onBack, onSave }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 animate-in fade-in duration-700">
      <div>
        <div className="flex items-center space-x-2 mb-1">
           <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-slate-400' : 'bg-indigo-500 animate-pulse'}`}></span>
           <p className={`text-xs font-semibold normal-case tracking-normal ${isLocked ? 'text-slate-400' : 'text-indigo-500'}`}>
             Gestão de Ativos
           </p>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 normal-case tracking-normal">
          {id ? 'Editar Registro' : 'Nova Intenção de Compra'}
        </h1>
        <p className="text-sm font-medium text-slate-400">
          Atualize as informações da negociação e os termos do contrato.
        </p>
      </div>
      <div className="flex items-center gap-4 mt-6 md:mt-0">
        <button 
          onClick={onBack} 
          className="px-6 py-4 text-slate-400 font-semibold normal-case text-xs tracking-normal hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
        >
          Voltar
        </button>
        
        <button 
          onClick={onSave} 
          disabled={isSaving} 
          className="px-10 py-4 bg-slate-900 text-white rounded-xl font-semibold text-xs normal-case tracking-normal shadow-sm shadow-slate-400 hover:bg-indigo-600 active:scale-95 disabled:opacity-50 transition-all flex items-center group"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
          ) : (
            <svg className="w-4 h-4 mr-2 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default FormCardHeader;
