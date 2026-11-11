import React from 'react';
import { ISocio } from '../../ajustes/socios/socios.types';

interface Props { stats: any; socios: ISocio[]; }

const EstoqueDashboard: React.FC<Props> = ({ stats }) => {
  const analytics = stats || { totalCustoBase: 0, totalServicos: 0, totalInvestido: 0, socioStats: [], count: 0 };
  const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const metrics = [
    { label: 'Total investido', value: currency(analytics.totalInvestido), hint: 'Compra + serviços', accent: true },
    { label: 'Veículos em pátio', value: String(analytics.count), hint: 'Unidades no estoque' },
    { label: 'Custo dos veículos', value: currency(analytics.totalCustoBase), hint: 'Valor de aquisição' },
    { label: 'Serviços agregados', value: currency(analytics.totalServicos), hint: 'Custos vinculados aos veículos' },
  ];
  return <section aria-label="Indicadores do estoque" className="space-y-3">
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(metric => <div key={metric.label} className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
        <dt className="text-xs font-medium text-slate-500">{metric.label}</dt>
        <dd className={`mt-1 text-xl font-semibold tracking-tight tabular-nums break-words ${metric.accent ? 'text-indigo-600' : 'text-slate-900'}`}>{metric.value}</dd>
        <p className="mt-1 text-xs text-slate-400">{metric.hint}</p>
      </div>)}
    </dl>
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-slate-900">Participação por sócio</h2>
        <p className="text-xs text-slate-500">Exposição de capital no estoque atual</p>
      </div>
      {analytics.socioStats.length === 0 ? <p className="text-xs text-slate-500">Nenhum sócio vinculado.</p> :
        <div className="grid gap-4 md:grid-cols-3">
          {analytics.socioStats.map((s: any, index: number) => <div key={s.id || index} className="min-w-0">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-medium text-slate-700" title={s.nome}>{s.nome}</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-800">{currency(s.totalvalor || s.totalValor || 0)}</span>
            </div>
            <div className="my-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${s.nome}: ${(s.percent || 0).toFixed(1)}% do estoque`}>
              <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.max(0, Math.min(100, s.percent || 0))}%` }} />
            </div>
            <p className="flex justify-between gap-2 text-xs text-slate-400"><span>{s.count} {s.count === 1 ? 'veículo' : 'veículos'}</span><span>{(s.percent || 0).toFixed(1)}%</span></p>
          </div>)}
        </div>}
    </div>
  </section>;
};
export default EstoqueDashboard;
