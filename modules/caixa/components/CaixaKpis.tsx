
import React from 'react';
import type { ICaixaDashboardData } from '../caixa.types';
import { getEstoqueResumo } from '../caixa.estoque';

interface Props {
  data: ICaixaDashboardData;
}

const CaixaKpis: React.FC<Props> = ({ data }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const kpis = [
    { label: 'Patrimônio Líquido', val: data.patrimonio_liquido, color: 'indigo', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Saldo Disponível', val: data.saldo_disponivel, color: 'emerald', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Ativos (Estoque)', val: data.total_ativos_estoque, color: 'blue', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', sub: getEstoqueResumo(data) },
    { label: 'Contas a Receber', val: data.total_recebiveis, color: 'amber', icon: 'M9 14l6-6m-5.5 .5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    { label: 'Contas a Pagar', val: data.total_passivo_circulante, color: 'rose', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Lucro do Mês', val: data.lucro_mensal, color: 'indigo', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Vendas (Recebido)', val: data.total_vendas_recebido, color: 'cyan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Compra (Vendidos)', val: data.total_custo_vendas, color: 'slate', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { label: 'Despesas Fixas', val: data.total_despesas_fixas, color: 'rose', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Despesas Variáveis', val: data.total_despesas_variaveis, color: 'rose', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ];

  const renderKpiCard = (k: any, i: number) => {
    const isMain = i < 2;
    return (
      <div
        key={i}
        className="dc-kpi-card flex items-start gap-3 group"
      >
        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="dc-kpi-label">
            {k.label}
          </p>
          <h4 className="dc-kpi-value">
            {fmt(k.val)}
          </h4>
          {k.sub && (
            <div className="dc-kpi-hint" aria-label="Composição do estoque">
              {k.sub.join(' | ')}
            </div>
          )}
        </div>
        {isMain && (
          <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-bl-full pointer-events-none"></div>
        )}
      </div>
    );
  };

  return (
    <div className="dc-kpi-grid">
      {kpis.map(renderKpiCard)}
    </div>
  );
};

export default CaixaKpis;
