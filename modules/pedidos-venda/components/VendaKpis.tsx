
import { getVendaCost, getVendaUnits } from '../utils/venda-values';
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedidos: IPedidoVenda[];
}

const VendaKpis: React.FC<Props> = ({ pedidos }) => {
  const stats = useMemo(() => {
    const concluídos = pedidos.filter(p => p.status === 'CONCLUIDO');
    const vgvTotal = concluídos.reduce((acc, p) => acc + (p.valor_venda || 0), 0);
    const lucroRealizado = concluídos.reduce((acc, p) => acc + (p.valor_venda - getVendaCost(p)), 0);

    return {
      vgv: vgvTotal,
      lucro: lucroRealizado,
      qtd: concluídos.reduce((sum, p) => sum + getVendaUnits(p), 0),
      ticket: concluídos.reduce((sum, p) => sum + getVendaUnits(p), 0) > 0 ? vgvTotal / concluídos.reduce((sum, p) => sum + getVendaUnits(p), 0) : 0
    };
  }, [pedidos]);

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="dc-kpi-grid">
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">VGV (Faturado)</p>
        <h3 className="dc-kpi-value">{fmt(stats.vgv)}</h3>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Lucro Bruto Realizado</p>
        <h3 className="dc-kpi-value">{fmt(stats.lucro)}</h3>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Veículos Vendidos</p>
        <h3 className="dc-kpi-value">{stats.qtd} <span className="text-xs font-semibold text-slate-400 normal-case">Unid.</span></h3>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Ticket Médio Saída</p>
        <h3 className="dc-kpi-value">{fmt(stats.ticket)}</h3>
      </div>
    </div>
  );
};

export default VendaKpis;
