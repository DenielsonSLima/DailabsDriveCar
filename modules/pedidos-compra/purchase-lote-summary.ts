import type { IPedidoCompra } from './pedidos-compra.types';

export function getPurchaseLoteSummary(pedido: IPedidoCompra) {
  const units = pedido.veiculos || [];
  const cost = units.reduce((sum, unit) => sum + Math.round(Number(unit.valor_custo || 0) * 100), 0) / 100;
  const services = units.reduce((sum, unit) => sum + Math.round(Number(unit.valor_custo_servicos || 0) * 100), 0) / 100;
  const hasProjection = units.length > 0 && units.every(unit => Number(unit.valor_venda) > 0);
  const projected = hasProjection ? units.reduce((sum, unit) => sum + Math.round(Number(unit.valor_venda) * 100), 0) / 100 : 0;
  const partners = new Map<string, { nome: string; valor: number; porcentagem: number; retorno: number }>();
  for (const unit of units) {
    for (const partner of unit.socios || []) {
      const current = partners.get(partner.socio_id) || { nome: partner.nome, valor: 0, porcentagem: 0, retorno: 0 };
      current.valor += Number(partner.valor || 0);
      partners.set(partner.socio_id, current);
    }
  }
  const total = cost + services;
  return { cost, services, total, projected, quantity: units.length,
    partners: [...partners.values()].map(partner => ({ ...partner,
      porcentagem: total > 0 ? partner.valor / total * 100 : 0,
      retorno: hasProjection && total > 0 ? (projected - total) * partner.valor / total : 0 })) };
}
