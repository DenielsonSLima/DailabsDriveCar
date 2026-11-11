
import React from 'react';

interface Props {
  id?: string;
  isSaving: boolean;
  status: string;
  onBack: () => void;
  onSave: () => void;
}

const FormHeaderVenda: React.FC<Props> = ({ id, isSaving, status, onBack, onSave }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 animate-in fade-in duration-700">
      <div>
        <div className="flex items-center space-x-2 mb-1">
           <span className={`w-2 h-2 rounded-full ${status === 'CONCLUIDO' ? 'bg-emerald-500' : 'bg-indigo-500 animate-pulse'}`}></span>
           <p className="text-xs font-semibold normal-case tracking-normal text-slate-400">Ciclo de Receita</p>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 normal-case tracking-normal">
          {id ? 'Detalhes da Venda' : 'Novo Pedido de Venda'}
        </h1>
        <p className="text-sm font-medium text-slate-500">
          {status === 'CONCLUIDO' ? 'Venda finalizada e veículo baixado do estoque.' : 'Preencha os dados do cliente e condições comerciais.'}
        </p>
      </div>
      <div className="flex items-center gap-4 mt-6 md:mt-0">
        <button 
          onClick={onBack} 
          className="px-6 py-4 text-slate-400 font-semibold normal-case text-xs tracking-normal hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
        >
          Voltar
        </button>
        
        {status !== 'CONCLUIDO' && (
          <button 
            onClick={onSave} 
            disabled={isSaving} 
            className="px-10 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-xs normal-case tracking-normal shadow-sm shadow-emerald-200 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all flex items-center group"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
            ) : (
              <svg className="w-4 h-4 mr-2 group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            Finalizar Venda
          </button>
        )}
      </div>
    </div>
  );
};

export default FormHeaderVenda;
