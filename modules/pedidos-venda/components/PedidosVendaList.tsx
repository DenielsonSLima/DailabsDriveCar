import React from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';
import PedidoVendaCard from './PedidoVendaCard';

interface Props {
    pedidos: IPedidoVenda[];
    loading: boolean;
    onEdit: (pedido: IPedidoVenda) => void;
}

const PedidosVendaList: React.FC<Props> = ({ pedidos, loading, onEdit }) => {
    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (pedidos.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400">
                <p className="text-sm font-medium">Nenhum pedido encontrado.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {pedidos.map(p => (
                <PedidoVendaCard key={p.id} pedido={p} onClick={() => onEdit(p)} />
            ))}
        </div>
    );
};

export default PedidosVendaList;
