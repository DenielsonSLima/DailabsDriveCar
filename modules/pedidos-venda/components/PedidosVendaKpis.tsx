
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
    <div className="space-y-3">
      <div className="dc-kpi-grid">
        <div className="dc-kpi-card">
          <p className="dc-kpi-label">Faturamento Bruto (VGV)</p>
          <h3 className="dc-kpi-value">{formatCurrency(stats.vgvTotal)}</h3>
          <p className="dc-kpi-hint">{stats.count} Veículos Vendidos</p>
        </div>
        <div className="dc-kpi-card">
          <p className="dc-kpi-label">Custo Total dos Ativos</p>
          <h3 className="dc-kpi-value">{formatCurrency(stats.custoTotal)}</h3>
          <p className="dc-kpi-hint">Compra + Preparação</p>
        </div>
        <div className="dc-kpi-card">
          <p className="dc-kpi-label">Resultado bruto das vendas</p>
          <h3 className="dc-kpi-value">{formatCurrency(stats.lucroBrutoTotal)}</h3>
          <p className="dc-kpi-hint">Margem: {stats.vgvTotal > 0 ? ((stats.lucroBrutoTotal / stats.vgvTotal) * 100).toFixed(1) : 0}%</p>
        </div>
        <div className="dc-kpi-card">
          <p className="dc-kpi-label">Ticket por unidade</p>
          <h3 className="dc-kpi-value">{formatCurrency(stats.ticketMedio)}</h3>
          <p className="dc-kpi-hint">Baseado em faturamento bruto</p>
        </div>
      </div>
      <section className="dc-panel">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
          <h3 className="dc-section-title">Participação por sócio</h3>
          <p className="dc-section-subtitle">Divisão real do lucro bruto gerado no período</p>
        </div>
        <div className="dc-partners">
          {stats.rankingSocios.length === 0 ? (
            <p className="dc-section-subtitle">Sem dados societários nas vendas atuais</p>
          ) : (
            stats.rankingSocios.map((s, idx) => (
              <div key={idx} className="min-w-0">
                <div className="flex flex-wrap justify-between items-baseline gap-x-3 gap-y-1 text-sm text-slate-700">
                  <span className="break-words">{s.nome}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(s.lucroReal)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden my-2">
                  <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${s.percentNoLucro}%` }} />
                </div>
                <div className="flex flex-wrap justify-between gap-2 dc-section-subtitle">
                  <span>{s.count} {s.count === 1 ? 'Unidade' : 'Unidades'}</span>
                  <span>{s.percentNoLucro.toFixed(1)}% do Lucro Total</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default PedidosVendaKpis;
