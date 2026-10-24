
import { getVendaCost } from '../../utils/venda-values';
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const VendaStats: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const v = pedido.veiculo as any;
  const custoTotal = getVendaCost(pedido);
  const lucro = pedido.valor_venda - custoTotal;
  const margem = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-700">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-20"></div>
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Preço de Venda</p>
        <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(pedido.valor_venda)}</h3>
        <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
           <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Custo do Ativo</span>
              <span className="text-sm font-bold text-slate-200">{formatCurrency(custoTotal)}</span>
           </div>
           <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Lucro Bruto</span>
              <span className="text-lg font-black text-emerald-400">{formatCurrency(lucro)}</span>
           </div>
           <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">Margem sobre Custo: {margem.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
};

export default VendaStats;
