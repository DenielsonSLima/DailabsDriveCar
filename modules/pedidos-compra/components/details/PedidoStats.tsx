import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
}

const PedidoStats: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const custoAquisicao = (pedido.veiculos || []).reduce((acc, v) => acc + (v.valor_custo || 0), 0);
  // Fix: Standardized variable name to valorExposto
  const valorExposto = custoAquisicao > 0 ? custoAquisicao : (pedido.valor_negociado || 0);

  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm h-full flex flex-col justify-between relative overflow-hidden group">
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10 space-y-8">
        <div>
           <p className="text-[11px] font-semibold text-indigo-400 normal-case tracking-normal mb-4 flex items-center">
             <span className="w-2 h-2 rounded-full bg-indigo-400 mr-3"></span>
             Investimento Total
           </p>
           {/* Fix: Using valorExposto correctly */}
           <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-normal leading-none">{formatCurrency(valorExposto)}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-1">Itens no Contrato</p>
              <p className="text-xl font-semibold text-slate-200">{(pedido.veiculos || []).length} <span className="text-xs opacity-50 normal-case">Unid.</span></p>
           </div>
           <div className="bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-1">Preço Médio / Unid.</p>
              <p className="text-sm font-semibold text-slate-200">
                {/* Fix: Using valorExposto correctly */}
                {formatCurrency(valorExposto / (Math.max(1, (pedido.veiculos || []).length)))}
              </p>
           </div>
        </div>
      </div>

      <div className="relative z-10 mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
         <div>
            <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal">Exposição de Capital</p>
            <div className="h-1.5 w-32 bg-white/10 rounded-full mt-2 overflow-hidden p-0.5 shadow-inner">
               <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
         </div>
         <div className="text-right">
            <span className="text-xs font-semibold bg-emerald-50/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 normal-case tracking-normal">
               Fluxo de Ativos
            </span>
         </div>
      </div>
    </div>
  );
};

export default PedidoStats;