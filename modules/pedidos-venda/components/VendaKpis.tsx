
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedidos: IPedidoVenda[];
}

const VendaKpis: React.FC<Props> = ({ pedidos }) => {
  const stats = useMemo(() => {
    const concluídos = pedidos.filter(p => p.status === 'CONCLUIDO');
    const vgvTotal = concluídos.reduce((acc, p) => acc + (p.valor_venda || 0), 0);
    const lucroRealizado = concluídos.reduce((acc, p) => {
      const custo = (p.veiculo?.valor_custo || 0) + (p.veiculo?.valor_custo_servicos || 0);
      return acc + (p.valor_venda - custo);
    }, 0);

    return {
      vgv: vgvTotal,
      lucro: lucroRealizado,
      qtd: concluídos.length,
      ticket: concluídos.length > 0 ? vgvTotal / concluídos.length : 0
    };
  }, [pedidos]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VGV (Faturado)</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{fmt(stats.vgv)}</h3>
      </div>
      <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Lucro Bruto Realizado</p>
        <h3 className="text-2xl font-black text-white mt-1">{fmt(stats.lucro)}</h3>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículos Vendidos</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.qtd} <span className="text-xs font-bold text-slate-400 uppercase">Unid.</span></h3>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Médio Saída</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{fmt(stats.ticket)}</h3>
      </div>
    </div>
  );
};

export default VendaKpis;
