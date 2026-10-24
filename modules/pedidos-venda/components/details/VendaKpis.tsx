
import { getVendaCost, getVendaValue } from '../../utils/venda-values';
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const VendaKpis: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const v = pedido.veiculo as any;
  // Regra: Custo Total = Aquisição + Serviços
  const aquisicao = pedido.lote_id ? getVendaCost(pedido) : v?.valor_custo || 0;
  const servicos = pedido.lote_id ? 0 : v?.valor_custo_servicos || 0;
  const custoTotal = aquisicao + servicos;
  
  // O valor de venda vem do pedido ou do veículo vinculado
  const venda = getVendaValue(pedido);
  const lucro = venda - custoTotal;
  const margem = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-in slide-in-from-bottom-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{pedido.lote_id ? 'Custo atualizado' : 'Custo Aquisição'}</p>
        <h3 className="text-lg font-black text-slate-900">{formatCurrency(aquisicao)}</h3>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <p className="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Serviços</p>
        <h3 className="text-lg font-black text-amber-600">{formatCurrency(servicos)}</h3>
      </div>

      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 shadow-sm">
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Investimento Total</p>
        <h3 className="text-lg font-black text-slate-800">{formatCurrency(custoTotal)}</h3>
      </div>

      <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm">
        <p className="text-emerald-600 text-[9px] font-black uppercase tracking-widest mb-1">Valor de Venda</p>
        <h3 className="text-xl font-black text-emerald-700">{formatCurrency(venda)}</h3>
      </div>

      <div className="bg-slate-900 p-5 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 rounded-full blur-2xl opacity-20"></div>
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 relative z-10">Lucro Bruto</p>
        <h3 className="text-xl font-black text-emerald-400 relative z-10">{formatCurrency(lucro)}</h3>
        <p className={`text-[8px] font-black uppercase mt-1 relative z-10 ${lucro >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
          M. Real: {margem.toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default VendaKpis;
