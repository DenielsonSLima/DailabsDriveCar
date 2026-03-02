import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
  isConsignacao?: boolean;
}

const OrderCostKpis: React.FC<Props> = ({ pedido, isConsignacao = false }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const veiculos = pedido.veiculos || [];

  // Lógica de Custo: Soma o custo de aquisição gravado no cadastro de cada veículo vinculado
  const custoAquisicaoVeiculos = veiculos.reduce((acc, v) => acc + (Number(v.valor_custo) || 0), 0);

  // Se não houver veículos vinculados ainda, mostra o valor negociado no cabeçalho do pedido
  const valorNegociadoPedido = Number(pedido.valor_negociado) || 0;

  // O "Custo de Compra" exibido será o maior entre o negociado e o real dos veículos (evita exibir zero se um estiver preenchido)
  const custoCompraFinal = custoAquisicaoVeiculos > 0 ? custoAquisicaoVeiculos : valorNegociadoPedido;

  const valorServicos = veiculos.reduce((acc, v: any) => acc + (Number(v.valor_custo_servicos) || 0), 0);
  const custoTotalAtivo = custoCompraFinal + valorServicos;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-3 duration-500">

      {/* KPI 1: CUSTO DE COMPRA (AQUISIÇÃO) / REPASSE */}
      <div className={`bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between group transition-all ${isConsignacao ? 'border-violet-200 hover:border-violet-300' : 'border-slate-200 hover:border-indigo-300'}`}>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isConsignacao ? 'text-violet-500' : 'text-slate-500'}`}>
            {isConsignacao ? 'Valor Repasse a Devolver' : 'Valor de Custo (Compra)'}
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tighter">{formatCurrency(custoCompraFinal)}</h3>
          {veiculos.length > 0 && valorNegociadoPedido !== custoAquisicaoVeiculos && valorNegociadoPedido > 0 && (
            <p className={`text-[8px] font-bold uppercase mt-1 ${isConsignacao ? 'text-violet-400' : 'text-amber-500'}`}>Ref. Negociada: {formatCurrency(valorNegociadoPedido)}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isConsignacao ? 'bg-violet-50 text-violet-500 border-violet-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      {/* KPI 2: SERVIÇOS AGREGADOS */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-amber-300 transition-all">
        <div>
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Serviços Agregados</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1 tracking-tighter">+{formatCurrency(valorServicos)}</h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </div>
      </div>

      {/* KPI 3: INVESTIMENTO TOTAL */}
      <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-slate-800 flex items-center justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-[60px] opacity-20"></div>
        <div className="relative z-10">
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Investimento Total Ativo</p>
          <h3 className="text-2xl font-black text-white mt-1 tracking-tighter">{formatCurrency(custoTotalAtivo)}</h3>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 relative z-10">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
      </div>
    </div>
  );
};

export default OrderCostKpis;