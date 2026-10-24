
import { getVendaCost, getVendaValue, getVendaUnits, getVendaPartnerResults } from '../utils/venda-values';
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedidos: IPedidoVenda[];
}

const PedidosVendaKpis: React.FC<Props> = ({ pedidos }) => {
  const stats = useMemo(() => {
    const ativos = pedidos.filter(p => p.status !== 'CANCELADO');
    const vgvTotal = ativos.reduce((acc, p) => acc + getVendaValue(p), 0);
    const custoTotal = ativos.reduce((acc, p) => acc + getVendaCost(p), 0);
    const unidades = ativos.reduce((acc, p) => acc + getVendaUnits(p), 0);

    const lucroBrutoTotal = vgvTotal - custoTotal;
    const ticketMedio = unidades > 0 ? vgvTotal / unidades : 0;

    // Mapa de Lucro por Sócio
    const socioMap = new Map<string, { nome: string, lucroReal: number, vgvRef: number, count: number }>();

    ativos.forEach(p => {
      getVendaPartnerResults(p).forEach(s => {
        const lucroSocio = s.retorno;
        const vgvSocio = s.valorVenda;

        const current = socioMap.get(s.socio_id) || { nome: s.nome, lucroReal: 0, vgvRef: 0, count: 0 };
        socioMap.set(s.socio_id, {
          ...current,
          lucroReal: current.lucroReal + lucroSocio,
          vgvRef: current.vgvRef + vgvSocio,
          count: current.count + s.count
        });
      });
    });

    const rankingSocios = Array.from(socioMap.values()).map(s => ({
      ...s,
      percentNoLucro: lucroBrutoTotal > 0 ? (s.lucroReal / lucroBrutoTotal) * 100 : 0
    })).sort((a, b) => b.lucroReal - a.lucroReal);

    return {
      vgvTotal,
      custoTotal,
      lucroBrutoTotal,
      ticketMedio,
      rankingSocios,
      count: unidades
    };
  }, [pedidos]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">

      {/* 1. TOP CARDS (3 COLUNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Faturamento Bruto (VGV)</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(stats.vgvTotal)}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">{stats.count} Veículos Vendidos</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Custo Total dos Ativos</p>
          <h3 className="text-2xl font-black text-slate-700 mt-1">{formatCurrency(stats.custoTotal)}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Compra + Preparação</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Resultado bruto das vendas</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(stats.lucroBrutoTotal)}</h3>
          <div className="mt-2 flex items-center space-x-2">
            <div className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase">
              M. {stats.vgvTotal > 0 ? ((stats.lucroBrutoTotal / stats.vgvTotal) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD AREA (ESTILO ESTOQUE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Ticket Médio Card */}
        <div className="lg:col-span-4">
          <div className="bg-indigo-700 rounded-[2.5rem] p-8 text-white h-full relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[80px]"></div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-4">Métrica de Saída</p>
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Ticket por unidade</h2>
            <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(stats.ticketMedio)}</p>
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest text-center">Baseado em faturamento bruto</p>
            </div>
          </div>
        </div>

        {/* Lista de Sócios (O QUE VOCÊ PEDIU) */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">PARTICIPAÇÃO POR SÓCIO</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Divisão real do lucro bruto gerado no período</p>
            </div>
          </div>

          <div className="space-y-6">
            {stats.rankingSocios.length === 0 ? (
              <div className="py-12 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">Sem dados societários nas vendas atuais</div>
            ) : (
              stats.rankingSocios.map((s, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-end justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black uppercase shadow-lg">{s.nome.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase truncate max-w-[180px]">{s.nome}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{s.count} {s.count === 1 ? 'Unidade' : 'Unidades'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 leading-none">{formatCurrency(s.lucroReal)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{s.percentNoLucro.toFixed(1)}% do Lucro Total</p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${s.percentNoLucro}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidosVendaKpis;
