
import React from 'react';

interface Props {
   vendas: number;
   compras: number;
   lucro: number;
   margem: number;
}

const MonthlyPerformance: React.FC<Props> = ({ vendas, compras, lucro, margem }) => {
   const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

   return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
         {/* Background Decorativo */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

         <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Fluxo de Resultados</h3>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-center">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Vendas</span>
               </div>
               <span className="text-xl font-black text-slate-900">{fmt(vendas)}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M11 17l-4-4m0 0l4-4m-4 4h12" /></svg>
                  </div>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Aquisições</span>
               </div>
               <span className="text-xl font-black text-slate-900">{fmt(compras)}</span>
            </div>

            <div className="flex flex-col items-end md:border-l md:border-slate-100 md:pl-8">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Lucro Realizado</p>
               <h4 className={`text-3xl font-[900] tracking-tighter ${lucro >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                  {fmt(lucro)}
               </h4>
               <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${lucro >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {margem.toFixed(1)}% Margem
               </div>
            </div>
         </div>
      </div>
   );
};

export default MonthlyPerformance;
