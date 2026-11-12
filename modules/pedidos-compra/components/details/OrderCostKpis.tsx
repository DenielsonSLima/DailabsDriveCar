import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
  isConsignacao?: boolean;
}

const OrderCostKpis: React.FC<Props> = ({ pedido, isConsignacao = false }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const veiculos = pedido?.veiculos || [];
  const valorNegociadoPedido = Number(pedido?.valor_negociado) || 0;

  // Lógica de Custo: Soma o custo de aquisição gravado no cadastro de cada veículo vinculado
  const custoAquisicaoVeiculos = veiculos.reduce((acc, v) => acc + (Number(v?.valor_custo) || 0), 0);

  // O "Custo de Compra" exibido será o maior entre o negociado e o real dos veículos (evita exibir zero se um estiver preenchido)
  const custoCompraFinal = custoAquisicaoVeiculos > 0 ? custoAquisicaoVeiculos : valorNegociadoPedido;

  const valorServicos = veiculos.reduce((acc, v: any) => acc + (Number(v?.valor_custo_servicos) || 0), 0);
  const custoTotalAtivo = (Number(custoCompraFinal) || 0) + (Number(valorServicos) || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in slide-in-from-bottom-3 duration-500">

      {/* KPI 1: CUSTO DE COMPRA (AQUISIÇÃO) / REPASSE */}
      <div className={`dc-kpi-card flex items-center justify-between gap-3 ${isConsignacao ? 'border-violet-200 hover:border-violet-300' : 'border-slate-200 hover:border-indigo-300'}`}>
        <div>
          <p className={`text-xs font-semibold normal-case tracking-normal ${isConsignacao ? 'text-violet-500' : 'text-slate-500'}`}>
            {isConsignacao ? 'Valor Repasse a Devolver' : 'Valor de Custo (Compra)'}
          </p>
          <h3 className="dc-kpi-value">{formatCurrency(custoCompraFinal)}</h3>
          {veiculos.length > 0 && valorNegociadoPedido !== custoAquisicaoVeiculos && valorNegociadoPedido > 0 && (
            <p className={`text-xs font-semibold normal-case mt-1 ${isConsignacao ? 'text-violet-400' : 'text-amber-500'}`}>Ref. Negociada: {formatCurrency(valorNegociadoPedido)}</p>
          )}
        </div>

      </div>

      {/* KPI 2: SERVIÇOS AGREGADOS */}
      <div className="dc-kpi-card flex items-center justify-between gap-3">
        <div>
          <p className="dc-kpi-label">Serviços Agregados</p>
          <h3 className="dc-kpi-value">+{formatCurrency(valorServicos)}</h3>
        </div>

      </div>

      {/* KPI 3: INVESTIMENTO TOTAL */}
      <div className="dc-kpi-card">

        <div className="relative z-10">
          <p className="dc-kpi-label">Investimento Total Ativo</p>
          <h3 className="dc-kpi-value">{formatCurrency(custoTotalAtivo)}</h3>
        </div>

      </div>
    </div>
  );
};

export default OrderCostKpis;