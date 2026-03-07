
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';
import { calculateNormalizedValue } from '../utils/profit-distribution';

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
      const v = p.veiculo as any;
      const valorVenda = p.valor_venda || 0;
      totalVGVGeral += valorVenda;

      if (v?.socios && Array.isArray(v.socios)) {
        const participacao = v.socios.find((s: any) => s.socio_id === socioIdFiltro);

        if (participacao) {
          const custoBase = (v.valor_custo || 0) + (v.valor_custo_servicos || 0);
          const vgvS = calculateNormalizedValue(valorVenda, participacao.porcentagem, v.socios);
          const custoS = calculateNormalizedValue(custoBase, participacao.porcentagem, v.socios);

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
    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 animate-in zoom-in-95 duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center">
              <svg className="w-6 h-6 mr-3 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Resultado Proporcional do Sócio
            </h3>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mt-1">Valores baseados na cota de participação de cada veículo</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <p className="text-[9px] font-black uppercase opacity-60">Representatividade no Lote</p>
            <p className="text-lg font-black">{analytics.participacaoNoLote.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white/10 p-5 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">VGV Proporcional</p>
            <p className="text-2xl font-black tracking-tight">{formatCurrency(analytics.vgvProporcional)}</p>
          </div>

          <div className="bg-white/10 p-5 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Custo Proporcional</p>
            <p className="text-2xl font-black tracking-tight">{formatCurrency(analytics.custoProporcional)}</p>
          </div>

          <div className="bg-emerald-400 p-5 rounded-3xl shadow-lg border-2 border-emerald-300">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-900 mb-1">Lucro do Sócio</p>
            <p className="text-2xl font-black text-emerald-900 tracking-tight">{formatCurrency(analytics.lucroProporcional)}</p>
          </div>

          <div className="bg-white/10 p-5 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Margem Real do Sócio</p>
            <p className="text-2xl font-black tracking-tight">{analytics.margemSocio.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendaSocioResultCard;
