import React from 'react';

export type LoteDetalhesTab = 'resumo' | 'entrada' | 'despesas' | 'saidas' | 'financeiro';

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
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold normal-case tracking-normal text-slate-500">{label}</p>
      <p className={`mt-1.5 break-words text-xl font-semibold tracking-tight tabular-nums ${metricTones[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
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
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LoteEmpty({ children }: { children: React.ReactNode }) {
  return <p className="p-4 text-sm leading-relaxed text-slate-500">{children}</p>;
}

export const tableThClass = 'px-4 py-3 text-left text-xs font-semibold normal-case tracking-normal text-slate-400';
export const tableTdClass = 'px-4 py-3 text-sm text-slate-700';
