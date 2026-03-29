import React from 'react';
import { ITituloCredito } from '../outros-creditos.types';

interface Props {
  kpis?: {
    total_creditado: number;
    total_pendente: number;
    total_atrasado: number;
  };
}

const CreditosKpis: React.FC<Props> = ({ kpis }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalRecebido = kpis?.total_creditado;
  const totalPendente = kpis?.total_pendente;
  const totalAtrasado = kpis?.total_atrasado;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-teal-300 transition-all">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Creditado</p>
          {totalRecebido !== undefined ? (
            <h3 className="text-2xl font-black text-teal-600 mt-1">{formatCurrency(totalRecebido)}</h3>
          ) : (
            <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-xl mt-1" />
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-50 text-teal-600 shadow-sm">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-teal-300 transition-all">
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Previsto (Em Aberto)</p>
          {totalPendente !== undefined ? (
            <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalPendente)}</h3>
          ) : (
            <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-xl mt-1" />
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between border border-slate-800">
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Atrasados</p>
          {totalAtrasado !== undefined ? (
            <h3 className="text-2xl font-black text-rose-500 mt-1">{formatCurrency(totalAtrasado)}</h3>
          ) : (
            <div className="h-8 w-16 bg-white/10 animate-pulse rounded-xl mt-1" />
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 text-rose-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
      </div>
    </div>
  );
};

export default CreditosKpis;
