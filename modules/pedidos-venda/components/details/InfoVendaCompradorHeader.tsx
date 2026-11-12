
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const InfoVendaCompradorHeader: React.FC<Props> = ({ pedido }) => {
  const c = pedido.cliente;
  const v = pedido.corretor;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12">

        {/* COMPRADOR */}
        <div className="lg:col-span-8 p-4 border-r border-slate-50">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-semibold shrink-0 shadow-sm">
              {c?.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-emerald-600 normal-case tracking-normal">Destino / Comprador</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono font-semibold text-slate-400">{c?.documento || 'Sem Documento'}</span>
              </div>
              <h2 className="dc-section-title font-semibold text-slate-900 normal-case tracking-normal mb-4">
                {c?.nome || 'CLIENTE NÃO IDENTIFICADO'}
              </h2>

              <div className="flex flex-wrap gap-y-2 gap-x-8 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                   <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                   <span className="normal-case">{pedido.logradouro}, {pedido.numero} - {pedido.bairro}</span>
                </div>
                <div className="flex items-center gap-2">
                   <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <span className="normal-case text-emerald-600 font-semibold">{pedido.cidade} / {pedido.uf}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VENDEDOR */}
        <div className="lg:col-span-4 p-4 bg-slate-50/50 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-200 shadow-sm shrink-0">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-400 normal-case tracking-normal mb-0.5">Responsável Venda</p>
              <h4 className="dc-section-title font-semibold text-slate-800 normal-case">
                {v ? `${v.nome} ${v.sobrenome}` : 'VENDA DIRETA / LOJA'}
              </h4>
              <p className="text-xs font-semibold text-slate-400 normal-case mt-0.5">Executivo de Negócios</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InfoVendaCompradorHeader;
