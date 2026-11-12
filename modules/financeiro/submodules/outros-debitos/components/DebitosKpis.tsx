import React from 'react';

interface Props {
  kpis?: {
    total_debitado: number;
    total_pendente: number;
    total_atrasado: number;
  } | null;
  loading?: boolean;
}

const DebitosKpis: React.FC<Props> = ({ kpis, loading }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalDebitado = kpis?.total_debitado ?? 0;
  const totalPendente = kpis?.total_pendente ?? 0;
  const totalAtrasado = kpis?.total_atrasado ?? 0;

  return (
    <div className="dc-kpi-grid">
      <div className="dc-kpi-card bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-rose-300 transition-all">
        <div>
          <p className="dc-kpi-label text-slate-500 text-xs font-medium normal-case tracking-normal">Total Debitado</p>
          {loading ? (
            <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-xl mt-1" />
          ) : (
            <h3 className="dc-kpi-value text-2xl font-semibold text-rose-600 mt-1">{formatCurrency(totalDebitado)}</h3>
          )}
        </div>
        <div className="w-8 h-8 shrink-0 ml-3 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div className="dc-kpi-card bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-rose-300 transition-all">
        <div>
          <p className="dc-kpi-label text-slate-500 text-xs font-medium normal-case tracking-normal">Previsto (Em Aberto)</p>
          {loading ? (
            <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-xl mt-1" />
          ) : (
            <h3 className="dc-kpi-value text-2xl font-semibold text-slate-900 mt-1">{formatCurrency(totalPendente)}</h3>
          )}
        </div>
        <div className="w-8 h-8 shrink-0 ml-3 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div className="dc-kpi-card bg-slate-50 p-4 rounded-xl shadow-sm flex items-center justify-between border border-slate-200">
        <div>
          <p className="dc-kpi-label text-slate-500 text-xs font-medium normal-case tracking-normal">Atrasados</p>
          {loading ? (
            <div className="h-8 w-16 bg-white animate-pulse rounded-xl mt-1" />
          ) : (
            <h3 className="dc-kpi-value text-2xl font-semibold text-rose-500 mt-1">{formatCurrency(totalAtrasado)}</h3>
          )}
        </div>
        <div className="w-8 h-8 shrink-0 ml-3 rounded-xl flex items-center justify-center bg-white text-rose-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
      </div>
    </div>
  );
};

export default DebitosKpis;
