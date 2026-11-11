import React from 'react';
import { IPendencias } from '../../../financeiro.types';

interface Props {
   pendencias: IPendencias;
   isLoading?: boolean;
}

const CardPendenciasUrgentes: React.FC<Props> = ({ pendencias, isLoading = false }) => {
   const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

   return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
         <h3 className="text-sm font-semibold text-slate-600 normal-case tracking-normal mb-8">Atenção Prioritária</h3>

         <div className="space-y-6">
            <div className={`flex flex-wrap items-start gap-3 p-4 rounded-2xl border ${isLoading ? 'bg-slate-50 border-slate-100 animate-pulse' : 'bg-rose-50 border-rose-100'}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLoading ? 'bg-slate-200' : 'bg-rose-500 text-white shadow-sm shadow-none'}`}>
                  {!isLoading && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
               </div>
               <div>
                  <p className={`text-xs font-medium normal-case tracking-normal mb-1 ${isLoading ? 'text-slate-300' : 'text-rose-600'}`}>Contas Atrasadas</p>
                  {isLoading ? (
                     <div className="h-7 w-24 bg-slate-200 rounded mb-1"></div>
                  ) : (
                     <p className="text-xl font-semibold text-rose-900 break-words">{formatCurrency(pendencias.atrasado.total)}</p>
                  )}
                  {isLoading ? (
                     <div className="h-3 w-32 bg-slate-200 rounded mt-1"></div>
                  ) : (
                     <p className="text-xs text-rose-700 font-medium normal-case mt-1">{pendencias.atrasado.count} Títulos vencidos</p>
                  )}
               </div>
            </div>

            <div className={`flex flex-wrap items-start gap-3 p-4 rounded-2xl border ${isLoading ? 'bg-slate-50 border-slate-100 animate-pulse' : 'bg-amber-50 border-amber-100'}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLoading ? 'bg-slate-200' : 'bg-amber-500 text-white shadow-sm shadow-none'}`}>
                  {!isLoading && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
               </div>
               <div>
                  <p className={`text-xs font-medium normal-case tracking-normal mb-1 ${isLoading ? 'text-slate-300' : 'text-amber-600'}`}>Vencimentos Hoje</p>
                  {isLoading ? (
                     <div className="h-7 w-24 bg-slate-200 rounded mb-1"></div>
                  ) : (
                     <p className="text-xl font-semibold text-amber-900 break-words">{formatCurrency(pendencias.hoje.total)}</p>
                  )}
                  {isLoading ? (
                     <div className="h-3 w-32 bg-slate-200 rounded mt-1"></div>
                  ) : (
                     <p className="text-xs text-amber-700 font-medium normal-case mt-1">Aguardando baixa ({pendencias.hoje.count})</p>
                  )}
               </div>
            </div>
         </div>

         <button className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-700 transition-all shadow-sm active:scale-100">
            Ver Conciliação Bancária
         </button>
      </div>
   );
};

export default CardPendenciasUrgentes;
