import type { IPedidoVenda, IVendaLoteItem } from '../pedidos-venda.types';
import { calculateNormalizedValue } from './profit-distribution';

type Venda = Partial<IPedidoVenda>;
const amount = (value: unknown) => Number(value) || 0;
const sumMoney = (values: number[]) => values.reduce((sum, value) => sum + Math.round(value * 100), 0) / 100;

export function isVendaLote(pedido: Venda): boolean {
  return !!pedido.lote_id;
}

export function getVendaUnits(pedido: Venda): number {
  if (!isVendaLote(pedido)) return pedido.veiculo_id || pedido.veiculo ? 1 : 0;
  return amount(pedido.quantidade_lote) || pedido.itens_lote?.length || 0;
}

export function getVendaOriginalCost(pedido: Venda): number {
  if (isVendaLote(pedido)) return sumMoney((pedido.itens_lote || []).map(item => amount(item.custo_na_venda)));
  return sumMoney([amount(pedido.veiculo?.valor_custo), amount(pedido.veiculo?.valor_custo_servicos)]);
}

export function getVendaCost(pedido: Venda): number {
  if (isVendaLote(pedido) && pedido.valor_custo_veiculo != null) return amount(pedido.valor_custo_veiculo);
  return getVendaOriginalCost(pedido);
}

export function getVendaValue(pedido: Venda): number {
  return isVendaLote(pedido) ? amount(pedido.valor_venda)
    : amount(pedido.valor_venda) > 0 ? amount(pedido.valor_venda) : amount(pedido.veiculo?.valor_venda);
}

export function getVendaDescription(pedido: Venda): string {
  if (isVendaLote(pedido)) return `${getVendaUnits(pedido)} unidade(s) do lote`;
  const v = pedido.veiculo;
  return [v?.montadora?.nome, v?.modelo?.nome, v?.versao?.nome].filter(Boolean).join(' ') || 'Veículo';
}

export interface VendaPartnerResult {
  socio_id: string; nome: string; porcentagem: number; investido: number;
  retorno: number; valorVenda: number; count: number; margem: number;
}

export function getVendaPartnerResults(pedido: Venda): VendaPartnerResult[] {
  const items = isVendaLote(pedido) ? (pedido.itens_lote || []) : [{
    veiculo: pedido.veiculo, custo_na_venda: getVendaCost(pedido), valor_venda: getVendaValue(pedido),
  } as IVendaLoteItem];
  // O agregado do pedido é autoritativo. Os custos atuais de cada unidade
  // determinam a distribuição quando há despesas específicas após a venda.
  const weights = items.map(item => isVendaLote(pedido) && pedido.valor_custo_veiculo != null
    && item.veiculo?.valor_custo != null
    ? amount(item.veiculo.valor_custo) + amount(item.veiculo.valor_custo_servicos)
    : amount(item.custo_na_venda));
  const totalWeight = weights.reduce((sum, cost) => sum + cost, 0);
  const totalCost = getVendaCost(pedido);
  const map = new Map<string, VendaPartnerResult>();
  for (const [index, item] of items.entries()) {
    const socios = item.veiculo?.socios || [];
    for (const socio of socios) {
      const itemCost = totalWeight > 0 ? totalCost * weights[index] / totalWeight : items.length ? totalCost / items.length : 0;
      const investido = calculateNormalizedValue(itemCost, socio.porcentagem, socios);
      const valorVenda = calculateNormalizedValue(amount(item.valor_venda), socio.porcentagem, socios);
      const current = map.get(socio.socio_id) || {
        socio_id: socio.socio_id, nome: socio.nome, porcentagem: socio.porcentagem,
        investido: 0, retorno: 0, valorVenda: 0, count: 0, margem: 0,
      };
      current.investido += investido;
      current.valorVenda += valorVenda;
      current.retorno += valorVenda - investido;
      current.count += 1;
      current.margem = current.investido > 0 ? current.retorno / current.investido * 100 : 0;
      map.set(socio.socio_id, current);
    }
  }
  return [...map.values()];
}

export function getVendaReportItem(pedido: Venda) {
  const custo = getVendaCost(pedido);
  const venda = getVendaValue(pedido);
  const identificacoes = isVendaLote(pedido) ? (pedido.itens_lote || []).map((item, index) =>
    `Unidade ${item.veiculo?.lote_ordem || index + 1}: ${[item.veiculo?.placa && `Placa ${item.veiculo.placa}`, item.veiculo?.chassi && `Chassi ${item.veiculo.chassi}`].filter(Boolean).join(' / ') || 'identificação pendente'}`
  ).join('; ') : pedido.veiculo?.placa || '';
  return {
    veiculo: getVendaDescription(pedido), quantidade: getVendaUnits(pedido), identificacoes,
    cliente: pedido.cliente?.nome || '—', custo, venda, lucro: sumMoney([venda, -custo]),
  };
}

export function withVendaTotals(pedido: IPedidoVenda): IPedidoVenda {
  if (!isVendaLote(pedido)) return pedido;
  const custo = getVendaCost(pedido);
  return { ...pedido, valor_custo_veiculo: custo, valor_lucro: sumMoney([getVendaValue(pedido), -custo]) };
}
