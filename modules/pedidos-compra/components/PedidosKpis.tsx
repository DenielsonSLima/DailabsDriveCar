
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">

      {/* KPI 1: Valor Total de Compra (Negociado) */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <div className="w-16 h-16 bg-indigo-600 rounded-full blur-xl"></div>
        </div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">Total Negociado (Compras)</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10 tracking-tight">
          {formatCurrency(stats.totalCompra)}
        </h3>
        <div className="mt-2 flex items-center space-x-1 relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{stats.qtd} Negociações</span>
        </div>
      </div>

      {/* KPI 2: Custo Total (Com Serviços) */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">Estoque (Custo + Serviços)</p>
        <h3 className="text-2xl font-black text-amber-600 mt-1 relative z-10 tracking-tight">
          {formatCurrency(stats.totalComServicos)}
        </h3>
        <div className="mt-2 flex items-center space-x-1 relative z-10">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Add. Serviços: <span className="text-amber-600">{formatCurrency(stats.deltaServicos)}</span>
          </span>
        </div>
      </div>

      {/* KPI 3: Total Investido (Global) */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Capital Comprometido</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1 tracking-tight">{formatCurrency(stats.totalInvestido)}</h3>
          </div>
        </div>
        <div className="mt-3 text-[10px] font-medium text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded-md">
          Compras + Rascunhos
        </div>
      </div>

      {/* KPI 4: Ticket Médio */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Ticket Médio (Compra)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{formatCurrency(stats.ticketMedio)}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
        </div>
        <div className="mt-3 text-[10px] font-medium text-slate-400">
          Média por Veículo
        </div>
      </div>

    </div>
  );
};

export default PedidosKpis;