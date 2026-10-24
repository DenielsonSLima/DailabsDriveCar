import type { ITitulo } from '../financeiro/financeiro.types';
import type { ILoteDetalhes, ILoteIndicadores } from './lotes.types';

const cents = (value: unknown): number => Math.round(Number(value || 0) * 100);
const sumMoney = <T,>(rows: T[], pick: (row: T) => unknown): number =>
  rows.reduce((total, row) => total + cents(pick(row)), 0) / 100;

export function getTituloPendente(title: ITitulo): number {
  if (title.status === 'CANCELADO') return 0;
  if (title.valor_pendente != null) return Math.max(0, cents(title.valor_pendente)) / 100;
  return Math.max(0, cents(title.valor_total) + cents(title.valor_acrescimo)
    - cents(title.valor_desconto) - cents(title.valor_pago)) / 100;
}

export function getVendaRecebimentos(details: ILoteDetalhes, vendaId: string) {
  const activeSale = details.vendas.some(sale => sale.id === vendaId && sale.status === 'CONCLUIDO');
  const titles = activeSale ? details.titulos.filter(title => title.venda_pedido_id === vendaId
    && title.tipo === 'RECEBER' && title.origem_tipo === 'PEDIDO_VENDA' && title.status !== 'CANCELADO') : [];
  return {
    recebido: sumMoney(titles, title => title.valor_pago),
    aReceber: sumMoney(titles, getTituloPendente),
  };
}

export function calcularIndicadoresLote(details: ILoteDetalhes): ILoteIndicadores {
  const { lote, unidades, titulos } = details;
  const sales = details.vendas.filter(sale => sale.status === 'CONCLUIDO');
  const saleIds = new Set(sales.map(sale => sale.id));
  const payments = titulos.filter(title => title.tipo === 'PAGAR' && title.status !== 'CANCELADO');
  const receipts = titulos.filter(title => title.tipo === 'RECEBER' && title.status !== 'CANCELADO'
    && title.origem_tipo === 'PEDIDO_VENDA' && saleIds.has(title.venda_pedido_id || ''));
  const sold = unidades.filter(unit => unit.status === 'VENDIDO');
  const remaining = unidades.filter(unit => unit.status !== 'VENDIDO');
  const unitCost = (unit: typeof unidades[number]) =>
    (cents(unit.is_consignado ? 0 : unit.valor_custo) + cents(unit.valor_custo_servicos)) / 100;
  const custoAquisicao = sumMoney(unidades, unit => unit.is_consignado ? 0 : unit.valor_custo);
  const despesas = sumMoney(unidades, unit => unit.valor_custo_servicos);
  const custoTotal = (cents(custoAquisicao) + cents(despesas)) / 100;
  const vendido = sumMoney(sales, sale => sale.valor_venda);
  const recebido = sumMoney(receipts, title => title.valor_pago);
  const pago = sumMoney(payments, title => title.valor_pago);
  const custoVendido = sumMoney(sold, unitCost);
  const custoVendidoOriginal = sumMoney(sales.flatMap(sale => sale.itens || []), item => item.custo_na_venda);
  return {
    compradas: Number(lote.quantidade_inicial),
    disponiveis: unidades.filter(unit => unit.status === 'DISPONIVEL').length,
    vendidas: sold.length,
    reservadas: unidades.filter(unit => unit.status === 'RESERVADO').length,
    preparacao: unidades.filter(unit => unit.status === 'PREPARACAO').length,
    custoAquisicao, despesas, custoTotal,
    custoMedio: unidades.length ? custoTotal / unidades.length : 0,
    pago, aPagar: sumMoney(payments, getTituloPendente),
    vendido, recebido, aReceber: sumMoney(receipts, getTituloPendente),
    custoVendido, custoVendidoOriginal,
    custoEstoque: sumMoney(remaining, unitCost),
    resultado: (cents(vendido) - cents(custoVendido)) / 100,
    resultadoOriginal: (cents(vendido) - cents(custoVendidoOriginal)) / 100,
    saldoCaixa: (cents(recebido) - cents(pago)) / 100,
  };
}

export const formatLoteCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
