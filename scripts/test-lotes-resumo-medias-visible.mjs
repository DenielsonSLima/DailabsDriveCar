import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const file = 'modules/lotes/components/details/LoteResumo.tsx';
const source = await readFile(file, 'utf8');
const previous = execFileSync('git', ['show', `36bc9b43c00559a6e629d85ab4a9692c0766e315:${file}`], { encoding: 'utf8' });
function functions(text) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(ast.parseDiagnostics.length, 0);
  return ast.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text.startsWith('getResumoLote')).map(node => node.getText(ast));
}
assert.deepEqual(functions(source), functions(previous), 'Existing averages/profit helpers must remain byte-for-byte unchanged');
const start = source.indexOf('      {/* Médias visíveis:');
const end = source.indexOf('      <div className="flex flex-wrap items-center gap-x-5', start);
assert.ok(start > 0 && end > start);
// Compare with the immutable production baseline, not moving HEAD after this test is committed.
// Presentation class changes are allowed; existing actions, conditions and calculations are not.
function withoutClasses(text) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const transformed = ts.transform(ast, [context => root => {
    const visit = node => ts.isJsxAttribute(node) && node.name.getText(ast) === 'className'
      ? undefined : ts.visitEachChild(node, visit, context);
    return ts.visitNode(root, visit);
  }]);
  const printed = ts.createPrinter({ removeComments: true }).printFile(transformed.transformed[0]);
  transformed.dispose();
  return printed;
}
assert.equal(withoutClasses(source.slice(0, start) + source.slice(end)), withoutClasses(previous), 'Existing content, actions, conditions and calculations must remain unchanged apart from visual classes');
const temp = await mkdtemp(join(tmpdir(), 'lote-medias-visible-'));
try {
  const outfile = join(temp, 'ssr.cjs');
  await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import Resumo, { getResumoLoteMedias, getResumoLoteLucros } from './modules/lotes/components/details/LoteResumo';
    export { getResumoLoteMedias, getResumoLoteLucros };
    export const render = (detalhes, stats) => renderToStaticMarkup(<Resumo detalhes={detalhes} stats={stats} onEncerrar={() => {}} canClose={false} onNavigate={() => {}} />);
  ` }, bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent' });
  const { render, getResumoLoteMedias: averages, getResumoLoteLucros: profits } = (await import(pathToFileURL(outfile).href)).default;
  const details = { lote: { encerrado: false }, unidades: Array.from({ length: 40 }, (_, id) => ({ id })), vendas: [{ status: 'CONCLUIDO', quantidade_lote: 18 }], despesas: [], titulos: [] };
  const stats = { custoAquisicao: 40000, despesas: 4000, custoTotal: 44000, vendido: 27000, custoAquisicaoEstoque: 22000, resultadoComEstoque: 5000, disponiveis: 22, reservadas: 0, preparacao: 0, compradas: 40, vendidas: 18, recebido: 0, aReceber: 27000, pago: 0, aPagar: 44000, saldoCaixa: 0, custoEstoque: 24200, custoVendidoOriginal: 19800, custoVendido: 19800, resultadoOriginal: 7200, resultado: 7200 };
  assert.deepEqual(averages(details, stats), { compra: 1000, despesa: 100, custo: 1100, venda: 1500, unidades: 40, unidadesVendidas: 18 });
  assert.equal(profits(stats, 18).medio, 5000 / 18);
  const main = render(details, stats).split('<details')[0];
  for (const label of ['Venda média', 'Despesa média', 'Compra média incluindo despesas', 'Lucro médio por moto', 'Lucro bruto', 'Lucro líquido do lote', 'Total vendido']) assert.ok(main.includes(label));
  for (const value of ['1.500,00', '100,00', '1.100,00']) assert.ok(main.includes(value));
  assert.ok(main.includes('todas as unidades do lote, vendidas ou em estoque'));
  assert.ok(main.includes('não some novamente'));
  assert.ok(main.includes('não significa que as despesas foram rateadas somente'));
  assert.ok(main.includes('Despesas específicas podem alterar'));
  const noSales = { ...details, vendas: [{ status: 'CANCELADO', quantidade_lote: 18 }] };
  assert.equal(averages(noSales, stats).venda, null);
  assert.ok(render(noSales, stats).includes('Sem vendas confirmadas para calcular a média'));
  const empty = { ...details, unidades: [], vendas: [] };
  assert.deepEqual(averages(empty, stats), { compra: null, despesa: null, custo: null, venda: null, unidades: 0, unidadesVendidas: 0 });
  const emptyMain = render(empty, stats).split('<details')[0];
  assert.ok(emptyMain.includes('Sem unidades no lote para calcular a média'));
  assert.equal((emptyMain.match(/>—</g) || []).length, 4);
  assert.doesNotMatch(emptyMain, /NaN|Infinity/);
  console.log('PASS: SSR partial sales (40/18), cancelled/no sales, empty lot; 3 visible averages; exact helper and existing-source parity.');
} finally { await rm(temp, { recursive: true, force: true }); }
