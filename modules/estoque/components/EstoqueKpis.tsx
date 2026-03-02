
import React, { useMemo } from 'react';
import { IVeiculo } from '../estoque.types';

interface Props {
  veiculos: IVeiculo[];
}

const EstoqueKpis: React.FC<Props> = ({ veiculos }) => {
  const stats = useMemo(() => {
    const ativos = veiculos;
    const totalInvestido = ativos.reduce((acc, v) => acc + (v.valor_custo || 0), 0);
    const totalVenda = ativos.reduce((acc, v) => acc + (v.valor_venda || 0), 0);
    const qtd = ativos.length;
    const ticketMedio = qtd > 0 ? totalVenda / qtd : 0;
    const lucroProjetado = totalVenda - totalInvestido;

    return { totalInvestido, totalVenda, qtd, ticketMedio, lucroProjetado };
  }, [veiculos]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">Total Investido (Custo)</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10 tracking-tight">
          {formatCurrency(stats.totalInvestido)}
        </h3>
        <div className="mt-2 flex items-center space-x-1 relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Patrimônio em Pátio</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest relative z-10">Valor Geral de Venda</p>
        <h3 className="text-2xl font-black text-emerald-600 mt-1 relative z-10 tracking-tight">
          {formatCurrency(stats.totalVenda)}
        </h3>
        <div className="mt-2 flex items-center space-x-1 relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-[10px] text-emerald-600 font-bold uppercase">Margem: {formatCurrency(stats.lucroProjetado)}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Veículos em Estoque</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.qtd}</h3>
          </div>
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
        </div>
        <div className="mt-3 text-[10px] font-medium text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded-md">
          Unidades Físicas
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Ticket Médio (Venda)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{formatCurrency(stats.ticketMedio)}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
        </div>
        <div className="mt-3 text-[10px] font-medium text-slate-400">
          Média por Unidade
        </div>
      </div>
    </div>
  );
};

export default EstoqueKpis;
