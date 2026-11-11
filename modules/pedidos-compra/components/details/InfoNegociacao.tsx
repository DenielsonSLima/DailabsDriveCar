
import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
}

const InfoNegociacao: React.FC<Props> = ({ pedido }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Card Fornecedor - Estilo Premium */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all flex flex-col justify-between">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[6rem] -mr-8 -mt-8 transition-transform group-hover:scale-105"></div>
         
         <div className="relative z-10">
            <div className="flex items-center space-x-5 mb-8">
               <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 normal-case font-semibold text-2xl">
                  {pedido.fornecedor?.nome.charAt(0)}
               </div>
               <div>
                  <p className="text-xs font-[900] text-indigo-500 normal-case tracking-normal mb-1">Origem / Fornecedor</p>
                  <h3 className="text-2xl font-semibold text-slate-900 normal-case tracking-normal truncate max-w-[280px]">
                    {pedido.fornecedor?.nome || 'NÃO IDENTIFICADO'}
                  </h3>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Documento Fiscal</p>
                    <p className="text-xs font-mono font-bold text-slate-700 tracking-normal">{pedido.fornecedor?.documento || '---'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Localização</p>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed normal-case">
                      {pedido.fornecedor?.cidade} / {pedido.fornecedor?.uf}
                    </p>
                  </div>
               </div>
               
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-2">Canal de Contato</p>
                  <div className="flex flex-col space-y-2">
                     <span className="text-xs font-semibold text-indigo-600">{pedido.fornecedor?.whatsapp || pedido.fornecedor?.telefone || 'SEM CONTATO'}</span>
                     <span className="text-xs font-bold text-slate-400 truncate lowercase">{pedido.fornecedor?.email || ''}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Card Corretor - Estilo Premium */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden group flex flex-col justify-between">
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-[6rem] -mr-8 -mt-8"></div>

         <div className="relative z-10">
            <div className="flex items-center space-x-5 mb-8">
               <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
               </div>
               <div>
                  <p className="text-xs font-[900] text-indigo-400 normal-case tracking-normal mb-1">Intermediação</p>
                  <h3 className="text-2xl font-semibold text-white normal-case tracking-normal">
                    {pedido.corretor ? `${pedido.corretor.nome} ${pedido.corretor.sobrenome}` : 'VENDA DIRETA'}
                  </h3>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
               {pedido.corretor ? (
                 <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div>
                       <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-1">Status do Parceiro</p>
                       <span className="text-xs font-semibold text-emerald-400 normal-case tracking-normal flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                          Comissionável / Ativo
                       </span>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-1">CPF</p>
                       <p className="text-xs font-mono font-bold text-slate-300">{pedido.corretor.cpf}</p>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-8 text-slate-500 border border-dashed border-white/10 rounded-2xl bg-white/2">
                    <svg className="w-8 h-8 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="text-xs font-semibold normal-case tracking-normal">Nenhum intermediário vinculado</p>
                 </div>
               )}
            </div>
         </div>
      </div>

    </div>
  );
};

export default InfoNegociacao;
