import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'drivecar-lote-values-'));
try {
  await build({
    stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
      export { calcularIndicadoresLote, getTituloPendente, getVendaRecebimentos } from './modules/lotes/lotes.utils';
      export { getPurchaseLoteSummary } from './modules/pedidos-compra/purchase-lote-summary';
    ` },
    bundle: true, platform: 'node', format: 'cjs', outfile: join(temp, 'values.cjs'), logLevel: 'silent',
  });
  const { calcularIndicadoresLote, getTituloPendente, getVendaRecebimentos, getPurchaseLoteSummary } =
    (await import(pathToFileURL(join(temp, 'values.cjs')).href)).default;
  const units = Array.from({ length: 50 }, (_, index) => ({ id: `u${index}`, lote_id: 'lote', lote_ordem: index + 1,
    status: index < 3 ? 'VENDIDO' : 'DISPONIVEL', valor_custo: 6080, valor_custo_servicos: 320,
    // O custo alocado já está incluso em valor_custo_servicos: não somar duas vezes.
    custo_lote_servicos: 320, valor_venda: 0,
    socios: [{ socio_id: 'owner', nome: 'Sócio', porcentagem: 100, valor: 6400 }] }));
  const payable = (id, amount, paid) => ({ id, tipo: 'PAGAR', status: paid === amount ? 'PAGO' : 'PENDENTE',
    valor_total: amount, valor_pago: paid, valor_pendente: amount - paid });
  const receivable = (id, amount, paid) => ({ id, venda_pedido_id: 'sale', origem_tipo: 'PEDIDO_VENDA',
    tipo: 'RECEBER', status: paid === amount ? 'PAGO' : 'PENDENTE', valor_total: amount,
    valor_pago: paid, valor_pendente: amount - paid });
  const details = {
    lote: { id: 'lote', quantidade_inicial: 50, custo_aquisicao: 304000 }, unidades: units, despesas: [],
    vendas: [{ id: 'sale', status: 'CONCLUIDO', valor_venda: 27000, quantidade_lote: 3,
      itens: units.slice(0, 3).map(unit => ({ veiculo_id: unit.id, custo_na_venda: 6280 })) }],
    titulos: [payable('buy', 304000, 304000), payable('freight', 10000, 10000), payable('mechanic', 6000, 0),
      receivable('entry', 12000, 12000), receivable('balance', 15000, 0),
      { ...receivable('loan', 999, 999), origem_tipo: 'MANUAL' },
      { ...receivable('cancelled', 10000, 10000), status: 'CANCELADO' }],
  };
  assert.deepEqual(calcularIndicadoresLote(details), {
    compradas: 50, disponiveis: 47, vendidas: 3, reservadas: 0, preparacao: 0,
    custoAquisicao: 304000, despesas: 16000, custoTotal: 320000, custoMedio: 6400,
    pago: 314000, aPagar: 6000, vendido: 27000, recebido: 12000, aReceber: 15000,
    custoVendido: 19200, custoVendidoOriginal: 18840, custoEstoque: 300800,
    resultado: 7800, resultadoOriginal: 8160, saldoCaixa: -302000,
  });
  assert.deepEqual(getVendaRecebimentos(details, 'sale'), { recebido: 12000, aReceber: 15000 });
  assert.equal(getTituloPendente({ status: 'PARCIAL', valor_total: 100, valor_pago: 40, valor_desconto: 10, valor_acrescimo: 5 }), 55);
  assert.equal(getTituloPendente({ status: 'PARCIAL', valor_pendente: 20, valor_total: 100, valor_pago: 40 }), 20);
  assert.equal(getTituloPendente({ status: 'CANCELADO', valor_pendente: 20 }), 0);

  const cancelled = structuredClone(details);
  cancelled.vendas[0].status = 'CANCELADO';
  cancelled.unidades.forEach(unit => { unit.status = 'DISPONIVEL'; });
  const cancelledStats = calcularIndicadoresLote(cancelled);
  assert.equal(cancelledStats.vendido, 0);
  assert.equal(cancelledStats.recebido, 0);
  assert.equal(cancelledStats.aReceber, 0);
  assert.equal(cancelledStats.disponiveis, 50);

  const purchase = { veiculos: structuredClone(units) };
  let summary = getPurchaseLoteSummary(purchase);
  assert.equal(summary.cost, 304000);
  assert.equal(summary.services, 16000);
  assert.equal(summary.partners[0].valor, 320000);
  assert.equal(summary.partners[0].retorno, 0);
  purchase.veiculos[0].valor_venda = 330000;
  summary = getPurchaseLoteSummary(purchase);
  assert.equal(summary.projected, 0, 'Preço isolado não pode projetar o retorno de 50 unidades');
  assert.equal(summary.partners[0].retorno, 0);
  purchase.veiculos.forEach(unit => { unit.valor_venda = 9000; });
  summary = getPurchaseLoteSummary(purchase);
  assert.equal(summary.projected, 450000);
  assert.equal(summary.partners[0].retorno, 130000);
  console.log('OK: cenário 50/304mil, despesas16mil, venda3/27mil, recebido12mil, saldo15mil, custos tardios, centavos, cancelados e sócios.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
