import React from 'react';
import { IHistoricoTotals } from '../../../financeiro.types';

interface Props {
  totals: IHistoricoTotals;
}

const ExtratoKpis: React.FC<Props> = ({ totals }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const { entradas_realizadas, saidas_realizadas, a_pagar_pendente, a_receber_pendente, saldo_periodo } = totals;

  return (
    <div className="dc-kpi-grid">
      <div className="dc-kpi-card bg-emerald-50 border border-emerald-100 p-5 rounded-xl shadow-sm">
        <p className="dc-kpi-label text-xs font-medium text-emerald-600 normal-case tracking-normal mb-1">Entradas Realizadas</p>
        <h3 className="dc-kpi-value text-xl font-semibold text-emerald-700">{formatCurrency(entradas_realizadas)}</h3>
      </div>
      <div className="dc-kpi-card bg-rose-50 border border-rose-100 p-5 rounded-xl shadow-sm">
        <p className="dc-kpi-label text-xs font-medium text-rose-600 normal-case tracking-normal mb-1">Saídas Realizadas</p>
        <h3 className="dc-kpi-value text-xl font-semibold text-rose-700">{formatCurrency(saidas_realizadas)}</h3>
      </div>
      <div className="dc-kpi-card bg-orange-50 border border-orange-100 p-5 rounded-xl shadow-sm">
        <p className="dc-kpi-label text-xs font-medium text-orange-600 normal-case tracking-normal mb-1">A Pagar (Pendente)</p>
        <h3 className="dc-kpi-value text-xl font-semibold text-orange-700">{formatCurrency(a_pagar_pendente)}</h3>
      </div>
      <div className="dc-kpi-card bg-teal-50 border border-teal-100 p-5 rounded-xl shadow-sm">
        <p className="dc-kpi-label text-xs font-medium text-teal-600 normal-case tracking-normal mb-1">A Receber (Pendente)</p>
        <h3 className="dc-kpi-value text-xl font-semibold text-teal-700">{formatCurrency(a_receber_pendente)}</h3>
      </div>
      <div className={`dc-kpi-card p-5 rounded-xl border shadow-sm ${saldo_periodo >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
        <p className={`dc-kpi-label text-xs font-medium normal-case tracking-normal mb-1 ${saldo_periodo >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>Saldo Período</p>
        <h3 className={`dc-kpi-value text-xl font-semibold ${saldo_periodo >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>{formatCurrency(saldo_periodo)}</h3>
      </div>
    </div>
  );
};

export default ExtratoKpis;