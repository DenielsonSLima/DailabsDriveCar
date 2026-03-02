import React from 'react';

const AjustesFinanceiroPage: React.FC = () => {
   return (
      <div className="space-y-6">
         <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center space-x-4 mb-8">
               <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Ajustes & Configurações</h2>
                  <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-widest">Plano de Contas e Regras de Negócio</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {['Categorias de Despesa', 'Plano de Contas', 'Limites de Operação', 'Regras de Juros', 'Alertas de Vencimento'].map((cfg, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group">
                     <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600">{cfg}</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Configurar Parâmetros</p>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};

export default AjustesFinanceiroPage;
