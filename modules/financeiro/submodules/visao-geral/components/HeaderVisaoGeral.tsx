import React from 'react';

const HeaderVisaoGeral: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 shrink-0 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm shadow-none">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
           </svg>
        </div>
        <div>
           <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 normal-case tracking-tight">Visão Geral Financeira</h2>
           <p className="text-slate-500 text-xs font-medium normal-case tracking-normal mt-1">Status de saúde do caixa e previsões</p>
        </div>
      </div>
    </div>
  );
};

export default HeaderVisaoGeral;
