
import { getVendaCost } from '../../utils/venda-values';
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const VendaStats: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const v = pedido.veiculo as any;
  const custoTotal = getVendaCost(pedido);
  const lucro = pedido.valor_venda - custoTotal;
  const margem = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-700">
      <div className="dc-kpi-card relative overflow-hidden">

        <p className="text-xs font-semibold text-emerald-600 normal-case tracking-normal mb-2">Preço de Venda</p>
        <h3 className="dc-kpi-value">{formatCurrency(pedido.valor_venda)}</h3>
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
           <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-semibold normal-case">Custo do Ativo</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(custoTotal)}</span>
           </div>
           <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <span className="text-xs text-emerald-600 font-semibold normal-case tracking-normal">Lucro Bruto</span>
              <span className="text-lg font-semibold text-emerald-600">{formatCurrency(lucro)}</span>
           </div>
           <p className="text-xs text-center text-slate-500 font-semibold normal-case tracking-normal">Margem sobre Custo: {margem.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default VendaStats;
