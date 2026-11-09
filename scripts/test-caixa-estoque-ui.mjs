import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'drivecar-caixa-estoque-'));
try {
  const entry = join(temp, 'test.mjs');
  await build({
    stdin: { contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import CaixaKpis from './modules/caixa/components/CaixaKpis';
      import CaixaPrint from './modules/caixa/components/CaixaPrint';
      import CaixaTemplate from './modules/relatorios/templates/caixa/CaixaTemplate';
      export { CaixaDashboardSchema } from './modules/caixa/caixa.types';
      export { getEstoqueResumo } from './modules/caixa/caixa.estoque';
      export const report = data => renderToStaticMarkup(React.createElement(CaixaTemplate, { data, empresa: {}, watermark: {} }));
      export const kpis = data => renderToStaticMarkup(React.createElement(CaixaKpis, { data }));
      export const print = data => renderToStaticMarkup(React.createElement(CaixaPrint, {
        data: { ...data, contas: [], investimento_socios: [], transacoes: [] },
        empresa: { nome_fantasia: 'Teste local' }, watermark: {}, periodo: 'Novembro 2026', forecast: []
      }));
    `, resolveDir: resolve('.') },
    outfile: entry, bundle: true, platform: 'node', format: 'esm',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  });
  const { CaixaDashboardSchema, getEstoqueResumo, kpis, print, report } = await import(pathToFileURL(entry));
  const sample = CaixaDashboardSchema.parse({ qtd_veiculos_estoque: 58, qtd_veiculos_individuais: 18,
    qtd_unidades_lotes: 40, qtd_motos_lotes: 40, total_ativos_estoque: 1648840 });
  assert.deepEqual(getEstoqueResumo(sample), ['18 veículos', '40 motos em lote']);
  for (const render of [kpis, print, report]) {
    const html = render(sample);
    assert.match(html, /18 veículos \| 40 motos em lote/);
    assert.doesNotMatch(html, /estoque individual/);
    assert.match(html, /40 motos em lote/);
    assert.match(html, /1\.648\.840,00/);
    assert.doesNotMatch(html, /58 veículos/);
  }
  const mixed = { ...sample, qtd_motos_lotes: 39 };
  assert.deepEqual(getEstoqueResumo(mixed), ['18 veículos', '40 unidades em lote']);
  assert.deepEqual(getEstoqueResumo({ ...sample, qtd_veiculos_estoque: 2, qtd_veiculos_individuais: 1,
    qtd_unidades_lotes: 1, qtd_motos_lotes: 1 }), ['1 veículo', '1 moto em lote']);
  assert.deepEqual(getEstoqueResumo({ ...sample, qtd_veiculos_estoque: 0, qtd_veiculos_individuais: 0,
    qtd_unidades_lotes: 0, qtd_motos_lotes: 0 }), ['0 veículos', '0 unidades em lote']);
  assert.deepEqual(getEstoqueResumo(CaixaDashboardSchema.parse({ qtd_veiculos_estoque: 58 })),
    ['58 veículos no total', 'Separação indisponível']);
  assert.deepEqual(getEstoqueResumo({ ...sample, qtd_unidades_lotes: 39 }),
    ['58 veículos no total', 'Separação indisponível']);
  assert.equal(CaixaDashboardSchema.safeParse({ qtd_motos_lotes: -1 }).success, false);
  if (process.argv.includes('--preview')) {
    await writeFile('/tmp/drivecar-ativos-preview.html', `<!doctype html><html lang="pt-BR"><head>
      <meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script>
      <style>body{font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:24px}</style></head><body>
      <h1 class="text-3xl font-black mb-6">Fluxo de Caixa &amp; Patrimônio</h1>${kpis(sample)}
      <h2 class="text-xl font-bold mt-8 mb-4">Impressão</h2>${print(sample)}</body></html>`);
  }
  console.log('PASS Caixa stock UI: schema, individual/lot/motorcycle labels, totals, print, pluralization, empty/mixed and legacy payloads');
} finally { await rm(temp, { recursive: true, force: true }); }
