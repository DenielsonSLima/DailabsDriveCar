
import { getVendaPartnerResults } from '../utils/venda-values';
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedidos: IPedidoVenda[];
  socioIdFiltro: string;
}

const VendaSocioResultCard: React.FC<Props> = ({ pedidos, socioIdFiltro }) => {
  const analytics = useMemo(() => {
    if (!socioIdFiltro) return null;

    let vgvProporcional = 0;
    let custoProporcional = 0;
    let totalVGVGeral = 0;

    pedidos.forEach(p => {
      const socios = getVendaPartnerResults(p);
      const valorVenda = p.valor_venda || 0;
      totalVGVGeral += valorVenda;

      {
        const participacao = socios.find(s => s.socio_id === socioIdFiltro);

        if (participacao) {
          const vgvS = participacao.valorVenda;
          const custoS = participacao.investido;

          vgvProporcional += vgvS;
          custoProporcional += custoS;
        }
      }
    });

    const lucroProporcional = vgvProporcional - custoProporcional;
    const margemSocio = vgvProporcional > 0 ? (lucroProporcional / vgvProporcional) * 100 : 0;
    const participacaoNoLote = totalVGVGeral > 0 ? (vgvProporcional / totalVGVGeral) * 100 : 0;

    return {
      vgvProporcional,
      custoProporcional,
      lucroProporcional,
      margemSocio,
      participacaoNoLote
    };
  }, [pedidos, socioIdFiltro]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!analytics) return null;

  return (
    <div className="dc-panel animate-in zoom-in-95 duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="dc-section-title font-semibold normal-case tracking-normal flex items-center">
              <svg className="w-6 h-6 mr-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Resultado Proporcional do Sócio
            </h3>
            <p className="text-slate-600 text-xs font-semibold normal-case tracking-normal mt-1">Valores baseados na cota de participação de cada veículo</p>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold normal-case opacity-60">Representatividade no Lote</p>
            <p className="text-lg font-semibold">{analytics.participacaoNoLote.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="dc-kpi-card">
            <p className="text-xs font-semibold normal-case tracking-normal text-slate-600 mb-1">VGV Proporcional</p>
            <p className="dc-kpi-value">{formatCurrency(analytics.vgvProporcional)}</p>
          </div>

          <div className="dc-kpi-card">
            <p className="text-xs font-semibold normal-case tracking-normal text-slate-600 mb-1">Custo Proporcional</p>
            <p className="dc-kpi-value">{formatCurrency(analytics.custoProporcional)}</p>
          </div>

          <div className="dc-kpi-card">
            <p className="text-xs font-semibold normal-case tracking-normal text-emerald-900 mb-1">Lucro do Sócio</p>
            <p className="dc-kpi-value">{formatCurrency(analytics.lucroProporcional)}</p>
          </div>

          <div className="dc-kpi-card">
            <p className="text-xs font-semibold normal-case tracking-normal text-slate-600 mb-1">Margem Real do Sócio</p>
            <p className="dc-kpi-value">{analytics.margemSocio.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendaSocioResultCard;
