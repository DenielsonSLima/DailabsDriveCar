import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'drivecar-lote-resultado-'));
try {
  const output = join(temp, 'resultado.cjs');
  await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import Resumo, { getResumoLoteLucros } from './modules/lotes/components/details/LoteResumo';
    import { calcularIndicadoresLote } from './modules/lotes/lotes.utils';
    export { calcularIndicadoresLote, getResumoLoteLucros };
    export const render = details => renderToStaticMarkup(<Resumo detalhes={details}
      stats={calcularIndicadoresLote(details)} onEncerrar={() => {}} canClose={false} onNavigate={() => {}} />);
  ` }, bundle: true, platform: 'node', format: 'cjs', outfile: output, logLevel: 'silent' });
  const { calcularIndicadoresLote: calculate, getResumoLoteLucros: profits, render } = (await import(pathToFileURL(output).href)).default;
  const title = (id, total, paid, extra = {}) => ({ id, tipo: 'PAGAR', status: paid === total ? 'PAGO' : 'PENDENTE',
    valor_total: total, valor_pago: paid, valor_pendente: total - paid, ...extra });
  const details = {
    lote: { quantidade_inicial: 40, custo_aquisicao: 304000 }, despesas: [], vendas: [],
    unidades: Array.from({ length: 40 }, (_, index) => ({ id: `u${index}`, status: 'DISPONIVEL',
      valor_custo: 7600, valor_custo_servicos: 0, custo_lote_servicos: 0 })),
    titulos: [title('compra', 304000, 304000)],
  };

  // Pagar pela compra não transforma o estoque em prejuízo nem em lucro.
  let stats = calculate(details);
  assert.equal(stats.custoAquisicaoEstoque, 304000);
  assert.equal(stats.resultadoComEstoque, 0);
  assert.equal(stats.saldoCaixa, -304000);
  assert.deepEqual(profits(stats, 0), { bruto: 0, liquido: 0, medio: null });
  const unpaid = structuredClone(details);
  unpaid.titulos[0] = title('compra', 304000, 0);
  assert.equal(calculate(unpaid).resultadoComEstoque, 0);
  assert.equal(calculate(unpaid).saldoCaixa, 0);

  // Regressão: 40 unidades, R$304 mil de compra e R$28.901 de despesas.
  details.unidades.forEach((unit, index) => {
    unit.valor_custo_servicos = index < 20 ? 722.53 : 722.52;
    unit.custo_lote_servicos = unit.valor_custo_servicos; // já incluído; nunca somar novamente
  });
  details.titulos.push(title('despesas', 28901, 28901));
  stats = calculate(details);
  assert.equal(stats.despesas, 28901);
  assert.equal(stats.custoEstoque, 332901);
  assert.equal(stats.custoAquisicaoEstoque, 304000);
  assert.equal(stats.resultadoComEstoque, -28901);
  assert.equal(stats.resultado, 0);
  assert.equal(stats.saldoCaixa, -332901);
  const html = render(details);
  const main = html.split('<details')[0];
  assert.match(main, /Lucro líquido do lote/);
  assert.match(main, /28\.901,00/);
  assert.match(html, /Estoque a custo de compra/);
  assert.doesNotMatch(main, /-R\$[^<]*332\.901,00/);
  assert.match(html, /Caixa e contas do lote/);
  assert.match(html, /Fluxo de caixa do lote/);
  assert.match(html, /não representa, por si só, prejuízo/);
  assert.match(html, /Lucro atualizado das vendidas/);

  // O resultado independe da quitação; despesas pendentes também entram uma vez.
  const expenseUnpaid = structuredClone(details);
  expenseUnpaid.titulos[1] = title('despesas', 28901, 0);
  assert.equal(calculate(expenseUnpaid).resultadoComEstoque, -28901);
  assert.equal(calculate(expenseUnpaid).aPagar, 28901);

  // Venda parcial a prazo: reconhecer venda, manter estoque restante e separar recebimento.
  details.unidades.slice(0, 3).forEach(unit => { unit.status = 'VENDIDO'; });
  details.unidades[3].status = 'RESERVADO';
  details.unidades[4].status = 'PREPARACAO';
  details.vendas.push({ id: 'venda', status: 'CONCLUIDO', quantidade_lote: 3, valor_venda: 27000,
    itens: details.unidades.slice(0, 3).map(unit => ({ custo_na_venda: 8322.53 })) });
  details.titulos.push(title('venda', 27000, 12000, { tipo: 'RECEBER', origem_tipo: 'PEDIDO_VENDA', venda_pedido_id: 'venda' }));
  stats = calculate(details);
  assert.equal(stats.custoAquisicaoEstoque, 281200);
  assert.equal(stats.resultadoComEstoque, -24701);
  assert.deepEqual(profits(stats, 3), { bruto: 4200, liquido: -24701, medio: -24701 / 3 });
  assert.match(render(details), /Lucro médio por moto/);
  assert.match(render(details), /Lucro líquido do lote/);
  assert.match(render(details), /Lucro bruto/);
  assert.equal(stats.resultado, 2032.41);
  assert.equal(stats.recebido, 12000);
  assert.equal(stats.aReceber, 15000);
  assert.equal(stats.saldoCaixa, -320901);
  const beforeSettlement = stats.resultadoComEstoque;
  details.titulos.at(-1).valor_pago = 27000;
  details.titulos.at(-1).valor_pendente = 0;
  assert.equal(calculate(details).resultadoComEstoque, beforeSettlement, 'Receber uma venda não gera lucro novamente');

  // Canceladas e rascunhos não acrescentam vendas/recebimentos ao resultado.
  const cancelled = structuredClone(details);
  cancelled.vendas[0].status = 'CANCELADO';
  cancelled.unidades.forEach(unit => { unit.status = 'DISPONIVEL'; });
  cancelled.vendas.push({ id: 'draft', status: 'RASCUNHO', valor_venda: 90000 });
  stats = calculate(cancelled);
  assert.equal(stats.vendido, 0);
  assert.equal(stats.recebido, 0);
  assert.equal(stats.resultadoComEstoque, -28901);

  // Com tudo vendido, o resultado com estoque coincide com o lucro atualizado.
  details.unidades.forEach(unit => { unit.status = 'VENDIDO'; });
  details.vendas[0].valor_venda = 400000;
  details.vendas[0].quantidade_lote = 40;
  stats = calculate(details);
  assert.equal(stats.custoAquisicaoEstoque, 0);
  assert.equal(stats.resultadoComEstoque, 67099);
  assert.deepEqual(profits(stats, 40), { bruto: 96000, liquido: 67099, medio: 67099 / 40 });
  assert.equal(stats.resultadoComEstoque, stats.resultado);

  // Centavos, unidades consignadas e lote sem unidades não inventam patrimônio.
  const tiny = { lote: { quantidade_inicial: 3 }, despesas: [], titulos: [], vendas: [], unidades: [
    { status: 'DISPONIVEL', valor_custo: 0.1, valor_custo_servicos: 0.01 },
    { status: 'RESERVADO', valor_custo: 0.2, valor_custo_servicos: 0.02 },
    { status: 'PREPARACAO', valor_custo: 100, is_consignado: true, valor_custo_servicos: 0.01 },
  ] };
  assert.equal(calculate(tiny).custoAquisicaoEstoque, 0.3);
  assert.equal(calculate(tiny).resultadoComEstoque, -0.04);
  assert.equal(calculate({ ...tiny, unidades: [] }).resultadoComEstoque, 0);
  console.log('OK: resultado gerencial com estoque, 40 motos/304mil/28.901 despesas, compras pagas e pendentes, vendas parciais e totais, recebimentos sem duplicação, canceladas, reservas, preparação, consignadas, centavos e UI separada do caixa.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
