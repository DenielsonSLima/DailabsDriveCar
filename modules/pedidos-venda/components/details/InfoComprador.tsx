
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const InfoComprador: React.FC<Props> = ({ pedido }) => {
  const c = pedido.cliente;

  const formatDoc = (doc?: string) => {
    if (!doc) return '---';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return doc;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
      {/* Dados do Cliente */}
      <div className="dc-panel lg:col-span-2 flex flex-col md:flex-row gap-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-semibold shrink-0 shadow-inner">
          {c?.nome.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
             <span className="text-xs font-semibold text-emerald-500 normal-case tracking-normal">Comprador</span>
             <span className="text-xs text-slate-300">•</span>
             <span className="text-xs font-semibold text-slate-400 normal-case">{c?.pessoa_tipo}</span>
          </div>
          <h2 className="dc-section-title font-semibold text-slate-900 normal-case tracking-normal mb-4">{c?.nome || 'NÃO INFORMADO'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Documento Oficial</p>
              <p className="text-sm font-mono font-semibold text-slate-700">{formatDoc(c?.documento)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Localização</p>
              <p className="text-sm font-semibold text-slate-700 truncate">{c?.cidade}/{c?.uf}</p>
            </div>
            <div className="md:col-span-2 border-t border-slate-50 pt-4">
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Endereço de Entrega</p>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                {pedido.logradouro}, {pedido.numero} • {pedido.bairro} <br/>
                CEP: {pedido.cep} {pedido.complemento && `• ${pedido.complemento}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Vendedor */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal mb-4">Intermediação</p>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h4 className="dc-section-title font-semibold text-slate-800 normal-case tracking-tight">
              {pedido.corretor ? `${pedido.corretor.nome} ${pedido.corretor.sobrenome}` : 'VENDA DIRETA'}
            </h4>
            <p className="text-xs font-semibold text-slate-400 normal-case mt-0.5">Responsável pela Venda</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoComprador;
