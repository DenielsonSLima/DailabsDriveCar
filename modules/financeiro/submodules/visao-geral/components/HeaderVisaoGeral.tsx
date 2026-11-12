import React from 'react';

const HeaderVisaoGeral: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 shrink-0 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-sm shadow-none">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
           </svg>
        </div>
        <div>
           <h2 className="dc-section-title">Visão Geral Financeira</h2>
           <p className="dc-section-subtitle mt-1">Status de saúde do caixa e previsões</p>
        </div>
      </div>
    </div>
  );
};

export default HeaderVisaoGeral;
