import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'drivecar-lotes-quantidade-'));
try {
  const file = join(temp, 'test.cjs');
  const result = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import Form from './modules/lotes/components/LoteQuantidadeForm';
import { calcularRateioAquisicao, atualizarDescricaoQuantidade, bloqueioAjusteQuantidade } from './modules/lotes/lotes.quantidade';
const rateio = calcularRateioAquisicao(304000, 40);
assert.equal(rateio.valorBase, 7600);
assert.equal(rateio.quantidadeBase, 40);
assert.equal(rateio.quantidadeExtra, 0);
assert.equal(rateio.total, 304000);
for (const quantity of [0, 1, -1, 1.5, NaN, Infinity, 10001]) assert.equal(calcularRateioAquisicao(304000, quantity), null);
for (const total of [-1, Infinity, NaN]) assert.equal(calcularRateioAquisicao(total, 40), null);
for (const quantity of [2, 3, 7, 40, 50, 9999, 10000]) {
  const r = calcularRateioAquisicao(304000.01, quantity);
  assert.equal(Math.round(r.valorBase * 100) * r.quantidadeBase + Math.round(r.valorExtra * 100) * r.quantidadeExtra, 30400001);
}
assert.equal(atualizarDescricaoQuantidade('Lote de 50 motos elétricas', 50, 40), 'Lote de 40 motos elétricas');
assert.equal(atualizarDescricaoQuantidade(' LOTE de 50 motos 2026', 50, 40), ' LOTE de 40 motos 2026');
assert.equal(atualizarDescricaoQuantidade('Compra 50 modelo 2026', 50, 40), 'Compra 50 modelo 2026');
const detalhes: any = { lote: { quantidade_inicial: 40, descricao: 'Lote de 40 motos elétricas', custo_aquisicao: 304000, encerrado: false }, vendas: [], despesas: [], unidades: [], titulos: [] };
assert.equal(bloqueioAjusteQuantidade(detalhes), null);
assert.match(bloqueioAjusteQuantidade({ ...detalhes, lote: { ...detalhes.lote, encerrado: true } }), /encerrado/);
assert.match(bloqueioAjusteQuantidade({ ...detalhes, vendas: [{ status: 'CANCELADO' }] }), /mesmo cancelada/);
const html = renderToStaticMarkup(<Form detalhes={detalhes} onSave={async () => { throw new Error('render must never save'); }} onClose={() => {}} />);
for (const text of ['Editar quantidade do lote', '304.000,00', '7.600,00', 'Custo de aquisição por unidade', 'Despesas do lote', 'arquivadas', 'min="2"', 'max="10000"', 'role="dialog"']) assert.ok(html.includes(text), text);
assert.match(html, /disabled=""[^>]*>Salvar quantidade e rateio/);
console.log('OK: quantidade 50→40, total R$304.000, unitário R$7.600, centavos, limites, descrição, bloqueios e formulário SSR.');
` }, bundle: true, platform: 'node', format: 'cjs', outfile: file, logLevel: 'silent', metafile: true, plugins: [{ name: 'offline-form', setup(bundler) {
    bundler.onLoad({ filter: /lib\/supabase\.ts$/ }, () => { throw new Error('No real database access in this test.'); });
    bundler.onLoad({ filter: /modules\/lotes\/components\/LoteUi\.tsx$/ }, async args => ({ contents: (await readFile(args.path, 'utf8')).replace("import { createPortal } from 'react-dom';", 'const createPortal = (children: React.ReactNode, _container?: unknown) => children;').replace(', document.body);', ', undefined);'), loader: 'tsx' }));
  } }] });
  assert.ok(!Object.keys(result.metafile.inputs).some(path => /lib\/supabase/.test(path)));
  await import(pathToFileURL(file).href);
} finally { await rm(temp, { recursive: true, force: true }); }
