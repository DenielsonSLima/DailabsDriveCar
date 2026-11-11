
import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';
import PedidoCompraCard from './PedidoCompraCard';

interface Props {
  pedidos: IPedidoCompra[];
  loading: boolean;
  onEdit: (pedido: IPedidoCompra) => void;
}

const PedidosList: React.FC<Props> = ({ pedidos, loading, onEdit }) => {
  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold normal-case text-xs tracking-normal">Buscando registros em tempo real...</p>
    </div>
  );

  if (pedidos.length === 0) return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
         <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      </div>
      <p className="text-slate-400 font-bold text-sm normal-case tracking-tight">Nenhum pedido encontrado nesta categoria.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {pedidos.map(p => (
        <PedidoCompraCard 
          key={p.id} 
          pedido={p} 
          onClick={() => onEdit(p)} 
        />
      ))}
    </div>
  );
};

export default PedidosList;
