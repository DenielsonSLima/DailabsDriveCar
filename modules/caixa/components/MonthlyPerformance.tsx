
import React from 'react';

interface Props {
   vendas: number;
   compras: number;
   lucro: number;
   margem: number;
}

const MonthlyPerformance: React.FC<Props> = ({ vendas, compras, lucro, margem }) => {
   const fmt = (v: number) => new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
   }).format(v);

   return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">

            {/* Lado Esquerdo: Principais Fluxos */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col justify-between">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Realizado</p>
                     <h4 className="text-xl font-black text-slate-900">{fmt(vendas)}</h4>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                     <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Entradas no Período</span>
                  </div>
               </div>

               <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col justify-between">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Investimento em Estoque</p>
                     <h4 className="text-xl font-black text-slate-900">{fmt(compras)}</h4>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                     <div className="w-6 h-6 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M11 17l-4-4m0 0l4-4m-4 4h12" /></svg>
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Saídas p/ Aquisição</span>
                  </div>
               </div>
            </div>

            {/* Lado Direito: Resultado Consolidado */}
            <div className="md:w-px md:h-20 bg-slate-100"></div>

            <div className="flex flex-col items-end min-w-[200px]">
               <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">Mês de Referência</span>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Resultado Líquido</p>
               <h4 className={`text-4xl font-black tracking-tighter ${lucro >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                  {fmt(lucro)}
               </h4>
               <div className="flex items-center gap-2 mt-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${lucro >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <p className="text-[11px] font-bold text-slate-600">
                     Margem de {margem.toFixed(1)}%
                  </p>
               </div>
            </div>

         </div>
      </div>
   );
};

export default MonthlyPerformance;
