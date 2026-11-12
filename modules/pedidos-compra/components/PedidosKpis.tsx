
import React, { useMemo } from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';

interface Props {
  pedidos: IPedidoCompra[];
}

const PedidosKpis: React.FC<Props> = ({ pedidos }) => {
  const stats = useMemo(() => {

    // Remove consignados dos cálculos
    const pedidosFiltrados = pedidos.filter(p => !p.forma_pagamento?.nome?.toLowerCase().includes('consigna'));

    // 1. Valor Total de Compra (Soma puramente o valor negociado na aquisição)
    const totalCompra = pedidosFiltrados.reduce((acc, p) => acc + (p.valor_negociado || 0), 0);

    // 2. Valor Total com Serviços (Soma o custo final do veículo no estoque, se existir)
    // Apenas para pedidos CONCLUIDOS que possuem veículo vinculado
    const totalComServicos = pedidosFiltrados.reduce((acc, p) => {
      // Fix: Property 'veiculo' does not exist on type 'IPedidoCompra'. Using 'veiculos' array instead.
      if (p.status === 'CONCLUIDO' && p.veiculos && p.veiculos.length > 0) {
        const totalCusto = p.veiculos.reduce((sum, v) => sum + (Number(v.valor_custo) || 0) + (Number(v.valor_custo_servicos) || 0), 0);
        return acc + totalCusto;
      }
      return acc;
    }, 0);

    // 3. Total Investido (Global)
    // Se for Efetivado: Usa o Custo Total (Compra + Serviços)
    // Se for Rascunho: Usa o Valor Negociado (Compromisso Financeiro)
    const totalInvestido = pedidosFiltrados.reduce((acc, p) => {
      // Fix: Property 'veiculo' does not exist on type 'IPedidoCompra'. Using 'veiculos' array instead.
      if (p.status === 'CONCLUIDO' && p.veiculos && p.veiculos.length > 0) {
        const totalCusto = p.veiculos.reduce((sum, v) => sum + (Number(v.valor_custo) || 0) + (Number(v.valor_custo_servicos) || 0), 0);
        return acc + totalCusto;
      }
      return acc + (Number(p.valor_negociado) || 0);
    }, 0);

    const qtd = pedidosFiltrados.length;
    const ticketMedio = qtd > 0 ? totalCompra / qtd : 0;

    // Diferença entre Custo Final e Compra (Gastos com Serviços)
    const deltaServicos = pedidosFiltrados.reduce((acc, p) => {
      if (p.status === 'CONCLUIDO' && p.veiculos && p.veiculos.length > 0) {
        return acc + p.veiculos.reduce((sum, v) => sum + (Number(v.valor_custo_servicos) || 0), 0);
      }
      return acc;
    }, 0);

    return { totalCompra, totalComServicos, totalInvestido, ticketMedio, qtd, deltaServicos };
  }, [pedidos]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="dc-kpi-grid">
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Total Negociado (Compras)</p>
        <h3 className="dc-kpi-value">{formatCurrency(stats.totalCompra)}</h3>
        <p className="dc-kpi-hint">{stats.qtd} Negociações</p>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Estoque (Custo + Serviços)</p>
        <h3 className="dc-kpi-value">{formatCurrency(stats.totalComServicos)}</h3>
        <p className="dc-kpi-hint">Add. Serviços: {formatCurrency(stats.deltaServicos)}</p>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Capital Comprometido</p>
        <h3 className="dc-kpi-value">{formatCurrency(stats.totalInvestido)}</h3>
        <p className="dc-kpi-hint">Compras + Rascunhos</p>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Ticket Médio (Compra)</p>
        <h3 className="dc-kpi-value">{formatCurrency(stats.ticketMedio)}</h3>
        <p className="dc-kpi-hint">Média por Veículo</p>
      </div>
    </div>
  );
};

export default PedidosKpis;
