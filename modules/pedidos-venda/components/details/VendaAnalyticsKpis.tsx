
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const VendaAnalyticsKpis: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);

  const v = pedido.veiculo as any;

  // 1. Custo de Aquisição
  const custoAquisicao = v?.valor_custo || 0;

  // 2. Custo de Serviços
  const custoServicos = v?.valor_custo_servicos || 0;

  // 3. Investimento Total
  const investimentoTotal = custoAquisicao + custoServicos;

  // 4. Valor da Venda (FIX: Fallback se o valor do pedido estiver zerado)
  const valorVenda = (pedido.valor_venda > 0 ? pedido.valor_venda : v?.valor_venda) || 0;

  // 5. Resultado Bruto
  const lucroBruto = valorVenda - investimentoTotal;

  // 6. Margem %
  const margem = investimentoTotal > 0 ? (lucroBruto / investimentoTotal) * 100 : 0;

  const kpis = [
    {
      label: 'Custo Aquisição',
      value: custoAquisicao,
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4',
      bg: 'bg-slate-50',
      text: 'text-slate-900'
    },
    {
      label: 'Custo Serviços',
      value: custoServicos,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      bg: 'bg-amber-50/50',
      text: 'text-amber-600'
    },
    {
      label: 'Custo Total',
      value: investimentoTotal,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2',
      bg: 'bg-indigo-50/50',
      text: 'text-indigo-600'
    },
    {
      label: 'Valor da Venda',
      value: valorVenda,
      icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2z',
      bg: 'bg-emerald-50/50',
      text: 'text-emerald-600'
    },
    {
      label: 'Resultado Bruto',
      value: lucroBruto,
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      bg: lucroBruto >= 0 ? 'bg-emerald-600' : 'bg-rose-600',
      text: 'text-white',
      isSpecial: true
    },
    {
      label: 'Margem Real %',
      value: margem,
      icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z',
      bg: 'bg-white',
      text: 'text-indigo-600',
      isPercent: true
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-in slide-in-from-bottom-3 duration-500">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className={`p-3.5 rounded-[2rem] border transition-all hover:shadow-lg ${kpi.isSpecial
              ? `${kpi.bg} border-transparent shadow-xl`
              : `${kpi.bg} border-slate-100`
            }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className={`text-[7px] font-black uppercase tracking-widest ${kpi.isSpecial ? 'text-white/70' : 'text-slate-400'}`}>
              {kpi.label}
            </p>
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${kpi.isSpecial ? 'bg-white/20 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={kpi.icon} />
              </svg>
            </div>
          </div>

          <h3 className={`text-sm font-black tracking-tight leading-none ${kpi.text}`}>
            {kpi.isPercent ? `${kpi.value.toFixed(1)}%` : formatCurrency(kpi.value as number)}
          </h3>
        </div>
      ))}
    </div>
  );
};

export default VendaAnalyticsKpis;
