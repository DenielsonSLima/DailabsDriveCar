import React from 'react';

interface Props {
  kpis?: {
    valor_total: number;
    total_recebido: number;
    total_em_aberto: number;
  };
}

const ReceberKpis: React.FC<Props> = ({ kpis }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const stats = [
    {
      label: 'Valor Total',
      value: kpis?.valor_total,
      color: 'blue',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      label: 'Total Recebido',
      value: kpis?.total_recebido,
      color: 'emerald',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      label: 'Total em Aberto',
      value: kpis?.total_em_aberto,
      color: 'rose',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {stats.map((s, idx) => (
        <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
            {s.value !== undefined ? (
              <h3 className={`text-2xl font-black mt-1 ${s.color === 'rose' ? 'text-rose-600' : s.color === 'amber' ? 'text-amber-600' : 'text-slate-900'}`}>
                {formatCurrency(s.value)}
              </h3>
            ) : (
              <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-lg mt-1" />
            )}
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color === 'blue' ? 'bg-blue-50 text-blue-600' : s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReceberKpis;
