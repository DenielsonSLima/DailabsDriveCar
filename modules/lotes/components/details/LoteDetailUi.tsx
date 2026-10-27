import React from 'react';

export type LoteDetalhesTab = 'resumo' | 'entrada' | 'despesas' | 'saidas';

const metricTones = {
  neutral: 'text-slate-900',
  indigo: 'text-indigo-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
};

export function LoteMetric({ label, value, hint, tone = 'neutral' }: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: keyof typeof metricTones;
}) {
  return (
    <div className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-2 break-words text-2xl font-black tracking-tight tabular-nums ${metricTones[tone]}`}>{value}</p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

export function LoteSection({ title, subtitle, action, children }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-black tracking-tight text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LoteEmpty({ children }: { children: React.ReactNode }) {
  return <p className="p-6 text-sm leading-relaxed text-slate-500">{children}</p>;
}

export const tableThClass = 'px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400';
export const tableTdClass = 'px-5 py-4 text-sm text-slate-700';
