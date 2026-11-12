
import { getVendaCost, getVendaValue } from '../../utils/venda-values';
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const VendaKpis: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const v = pedido.veiculo as any;
  // Regra: Custo Total = Aquisição + Serviços
  const aquisicao = pedido.lote_id ? getVendaCost(pedido) : v?.valor_custo || 0;
  const servicos = pedido.lote_id ? 0 : v?.valor_custo_servicos || 0;
  const custoTotal = aquisicao + servicos;

  // O valor de venda vem do pedido ou do veículo vinculado
  const venda = getVendaValue(pedido);
  const lucro = venda - custoTotal;
  const margem = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-in slide-in-from-bottom-6">
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">{pedido.lote_id ? 'Custo atualizado' : 'Custo Aquisição'}</p>
        <h3 className="dc-kpi-value">{formatCurrency(aquisicao)}</h3>
      </div>

      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Total Serviços</p>
        <h3 className="dc-kpi-value">{formatCurrency(servicos)}</h3>
      </div>

      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Investimento Total</p>
        <h3 className="dc-kpi-value">{formatCurrency(custoTotal)}</h3>
      </div>

      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Valor de Venda</p>
        <h3 className="dc-kpi-value">{formatCurrency(venda)}</h3>
      </div>

      <div className="dc-kpi-card">

        <p className="dc-kpi-label">Lucro Bruto</p>
        <h3 className="dc-kpi-value">{formatCurrency(lucro)}</h3>
        <p className={`text-xs font-semibold normal-case mt-1 relative z-10 ${lucro >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
          M. Real: {margem.toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default VendaKpis;
