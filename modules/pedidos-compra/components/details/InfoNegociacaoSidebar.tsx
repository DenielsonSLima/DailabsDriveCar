
import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
}

const InfoNegociacaoSidebar: React.FC<Props> = ({ pedido }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      <div className="p-4 bg-white text-slate-900 border-b border-slate-200">
        <h3 className="dc-section-title font-semibold normal-case tracking-normal">Parceiros de Negócio</h3>
      </div>

      <div className="p-4 space-y-8">
        {/* Fornecedor */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-semibold text-lg shrink-0 border border-slate-200">
            {pedido.fornecedor?.nome.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal leading-none mb-1">Origem / Fornecedor</p>
            <h4 className="dc-section-title font-semibold text-slate-900 normal-case">{pedido.fornecedor?.nome || 'NÃO IDENTIFICADO'}</h4>
            <p className="text-xs text-slate-400 font-mono mt-1">{pedido.fornecedor?.documento || 'Sem doc'}</p>
            <div className="flex flex-col mt-3 space-y-1">
               <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  {pedido.fornecedor?.cidade} / {pedido.fornecedor?.uf}
               </span>
               <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {pedido.fornecedor?.whatsapp || pedido.fornecedor?.telefone || 'SEM CONTATO'}
               </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-50"></div>

        {/* Corretor */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-100 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-400 normal-case tracking-normal leading-none mb-1">Intermediação</p>
            <h4 className="dc-section-title font-semibold text-slate-900 normal-case">
              {pedido.corretor ? `${pedido.corretor.nome} ${pedido.corretor.sobrenome}` : 'VENDA DIRETA'}
            </h4>
            {pedido.corretor ? (
              <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600 normal-case border border-emerald-100">
                Comissionável
              </span>
            ) : (
              <p className="text-xs text-slate-300 font-semibold normal-case mt-1">Sem corretor vinculado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoNegociacaoSidebar;
