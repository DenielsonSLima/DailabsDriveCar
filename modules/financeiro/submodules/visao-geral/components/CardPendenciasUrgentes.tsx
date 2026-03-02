import React from 'react';
import { IPendencias } from '../../../financeiro.types';

interface Props {
   pendencias: IPendencias;
   isLoading?: boolean;
}

const CardPendenciasUrgentes: React.FC<Props> = ({ pendencias, isLoading = false }) => {
   const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

   return (
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
         <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Atenção Prioritária</h3>

         <div className="space-y-6">
            <div className={`flex items-start space-x-4 p-5 rounded-3xl border ${isLoading ? 'bg-slate-50 border-slate-100 animate-pulse' : 'bg-rose-50 border-rose-100'}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLoading ? 'bg-slate-200' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'}`}>
                  {!isLoading && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
               </div>
               <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isLoading ? 'text-slate-300' : 'text-rose-600'}`}>Contas Atrasadas</p>
                  {isLoading ? (
                     <div className="h-7 w-24 bg-slate-200 rounded mb-1"></div>
                  ) : (
                     <p className="text-xl font-black text-rose-900">{formatCurrency(pendencias.atrasado.total)}</p>
                  )}
                  {isLoading ? (
                     <div className="h-3 w-32 bg-slate-200 rounded mt-1"></div>
                  ) : (
                     <p className="text-[9px] text-rose-400 font-bold uppercase mt-1">{pendencias.atrasado.count} Títulos vencidos</p>
                  )}
               </div>
            </div>

            <div className={`flex items-start space-x-4 p-5 rounded-3xl border ${isLoading ? 'bg-slate-50 border-slate-100 animate-pulse' : 'bg-amber-50 border-amber-100'}`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLoading ? 'bg-slate-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200'}`}>
                  {!isLoading && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
               </div>
               <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isLoading ? 'text-slate-300' : 'text-amber-600'}`}>Vencimentos Hoje</p>
                  {isLoading ? (
                     <div className="h-7 w-24 bg-slate-200 rounded mb-1"></div>
                  ) : (
                     <p className="text-xl font-black text-amber-900">{formatCurrency(pendencias.hoje.total)}</p>
                  )}
                  {isLoading ? (
                     <div className="h-3 w-32 bg-slate-200 rounded mt-1"></div>
                  ) : (
                     <p className="text-[9px] text-amber-400 font-bold uppercase mt-1">Aguardando baixa ({pendencias.hoje.count})</p>
                  )}
               </div>
            </div>
         </div>

         <button className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95">
            Ver Conciliação Bancária
         </button>
      </div>
   );
};

export default CardPendenciasUrgentes;
