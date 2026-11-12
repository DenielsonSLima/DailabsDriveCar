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
    <div className="dc-kpi-card h-full flex flex-col justify-between relative overflow-hidden group">
      {/* Background Decorativo */}


      <div className="relative z-10 space-y-4">
        <div>
           <p className="text-xs font-semibold text-indigo-600 normal-case tracking-normal mb-4 flex items-center">
             <span className="w-2 h-2 rounded-full bg-indigo-400 mr-3"></span>
             Investimento Total
           </p>
           {/* Fix: Using valorExposto correctly */}
           <h3 className="dc-kpi-value">{formatCurrency(valorExposto)}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 border border-slate-200 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-1">Itens no Contrato</p>
              <p className="text-xl font-semibold text-slate-900">{(pedido.veiculos || []).length} <span className="text-xs opacity-50 normal-case">Unid.</span></p>
           </div>
           <div className="bg-white/5 border border-slate-200 p-4 rounded-2xl backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-1">Preço Médio / Unid.</p>
              <p className="text-sm font-semibold text-slate-900">
                {/* Fix: Using valorExposto correctly */}
                {formatCurrency(valorExposto / (Math.max(1, (pedido.veiculos || []).length)))}
              </p>
           </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
         <div>
            <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal">Exposição de Capital</p>
            <div className="h-1.5 w-32 bg-white/10 rounded-full mt-2 overflow-hidden p-0.5 shadow-inner">
               <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
         </div>
         <div className="text-right">
            <span className="text-xs font-semibold bg-emerald-50/10 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-500/20 normal-case tracking-normal">
               Fluxo de Ativos
            </span>
         </div>
      </div>
    </div>
  );
};

export default PedidoStats;