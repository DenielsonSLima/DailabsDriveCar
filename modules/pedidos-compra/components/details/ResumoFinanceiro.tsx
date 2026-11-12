
import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
}

const ResumoFinanceiro: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="dc-panel h-full flex flex-col justify-between group hover:border-indigo-300 transition-all">
       <div>
         <div className="flex items-center justify-between mb-8">
            <h3 className="dc-section-title font-semibold text-slate-400 normal-case tracking-normal flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Termos de Quitação
            </h3>
            {pedido.status === 'CONCLUIDO' && (
              <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-xs font-semibold normal-case border border-emerald-100">
                Títulos Gerados
              </span>
            )}
         </div>

         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <span className="text-sm font-medium text-slate-500">Valor Negociado</span>
               <span className="text-xl font-semibold text-slate-900">{formatCurrency(pedido.valor_negociado)}</span>
            </div>

            <div className="flex justify-between items-center pb-6 border-b border-slate-50">
               <span className="text-sm font-medium text-slate-500">Modalidade</span>
               <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700 normal-case">{pedido.forma_pagamento?.nome || 'A COMBINAR'}</p>
                  <p className="text-xs text-slate-400 font-semibold normal-case tracking-normal">
                    {pedido.forma_pagamento?.destino_lancamento === 'CONSIGNACAO' ? 'ACERTO PÓS-VENDA' : 'MOVIMENTAÇÃO DIRETA'}
                  </p>
               </div>
            </div>
         </div>
       </div>

       <div className="mt-8 bg-slate-50 rounded-2xl p-4 flex items-center space-x-4 border border-slate-100">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm shrink-0">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
             <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal leading-none">Previsão</p>
             <p className="text-xs font-semibold text-slate-700 mt-1 normal-case">
                {pedido.previsao_pagamento ? new Date(pedido.previsao_pagamento).toLocaleDateString('pt-BR') : 'DATA NÃO INFORMADA'}
             </p>
          </div>
       </div>
    </div>
  );
};

export default ResumoFinanceiro;
