
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const InfoComercial: React.FC<Props> = ({ pedido }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="flex items-center space-x-4 mb-6">
         <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-semibold text-xl shadow-sm">
            {pedido.cliente?.nome.charAt(0)}
         </div>
         <div>
            <p className="text-xs font-semibold text-emerald-500 normal-case tracking-normal leading-none mb-1">Cliente Comprador</p>
            <h3 className="text-2xl font-semibold text-slate-900 normal-case tracking-normal">{pedido.cliente?.nome}</h3>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 normal-case mb-1">Documento</p>
            <p className="text-xs font-mono font-bold text-slate-700">{pedido.cliente?.documento || '---'}</p>
         </div>
         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 normal-case mb-1">Localização</p>
            <p className="text-xs font-bold text-slate-700">{pedido.cliente?.cidade}/{pedido.cliente?.uf}</p>
         </div>
         <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 normal-case mb-1">Contato</p>
            <p className="text-xs font-bold text-slate-700">{pedido.cliente?.whatsapp || pedido.cliente?.telefone || '---'}</p>
         </div>
      </div>
    </div>
  );
};

export default InfoComercial;
