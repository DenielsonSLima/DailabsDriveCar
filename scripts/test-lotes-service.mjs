import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// SDK PostgREST real, transporte local: não acessa Supabase nem credenciais.
const temp = await mkdtemp(join(tmpdir(), 'drivecar-lotes-service-'));
try {
  await build({ stdin: { resolveDir: process.cwd(), contents: `export { LotesService } from './modules/lotes/lotes.service'; export { TitulosService } from './modules/financeiro/services/titulos.service';`, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs',
    outfile: join(temp, 'service.cjs'), logLevel: 'silent', plugins: [{ name: 'offline-lotes', setup(build) {
      build.onLoad({ filter: /lib\/supabase\.ts$/ }, () => ({ loader: 'ts', contents: `
        import { createClient } from '@supabase/supabase-js';
        export const supabase = createClient('https://lotes.test', 'test-key', {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: (...args) => globalThis.__lotesFetch(...args) }
        });` }));
      build.onLoad({ filter: /ajustes\/empresa\/empresa\.service\.ts$/ }, () => ({ loader: 'ts', contents:
        'export const EmpresaService = { getCurrentOrganizationId: async () => globalThis.__lotesOrg };' }));
    } }],
  });
  const { LotesService, TitulosService } = (await import(pathToFileURL(join(temp, 'service.cjs')).href)).default;
  globalThis.__lotesOrg = 'org-a';
  let requests = [];
  let handler = () => ({ body: null });
  globalThis.__lotesFetch = async (input, options = {}) => {
    const request = { url: new URL(input), method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : undefined };
    requests.push(request);
    const result = await handler(request);
    return new Response(JSON.stringify(result.body), { status: result.status || 200,
      headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/1' } });
  };
  const expectRpc = (name, body) => {
    const request = requests.at(-1);
    assert.equal(request.url.pathname, '/rest/v1/rpc/' + name);
    assert.equal(request.method, 'POST');
    assert.deepEqual(request.body, body);
  };
  handler = () => ({ body: 'batch-id' });
  assert.equal(await LotesService.criar({ veiculoId: 'representative', quantidade: 50, descricao: '50 motos' }), 'batch-id');
  expectRpc('criar_lote', { p_veiculo_id: 'representative', p_quantidade: 50, p_descricao: '50 motos' });

  const sale = { cliente_id: 'client', quantidade: 3, valor_total: 27000, data_venda: '2026-10-24',
    pagamentos: [{ valor: 12000, data_recebimento: '2026-10-24', forma_pagamento_id: 'pix', conta_bancaria_id: 'bank' },
      { valor: 15000, data_recebimento: '2026-11-24', forma_pagamento_id: 'term', conta_bancaria_id: null }] };
  const expense = { descricao: 'Frete', valor_total: 10000, data_vencimento: '2026-10-30', categoria_id: 'freight', pago_agora: false };
  for (const [method, name, data] of [
    ['registrarVenda', 'registrar_venda_lote', sale], ['registrarDespesa', 'registrar_despesa_lote', expense],
  ]) {
    for (let retry = 0; retry < 2; retry++) {
      await LotesService[method]('batch', data, 'intent-' + method);
      expectRpc(name, { p_lote_id: 'batch', p_dados: data, p_request_id: 'intent-' + method });
    }
  }
  // Uma mesma intenção de baixa parcial mantém a chave ao repetir a chamada.
  const settlement = { tituloId: 'title', valor: 123.45, contaId: 'bank', formaId: 'pix', data: '2026-10-24', requestId: 'settlement-intent' };
  for (let retry = 0; retry < 2; retry++) {
    await LotesService.baixarTitulo(settlement);
    expectRpc('baixar_titulo_lote', { p_titulo_id: 'title', p_valor: 123.45, p_conta_id: 'bank',
      p_forma_pagamento_id: 'pix', p_data_pagamento: '2026-10-24', p_request_id: 'settlement-intent' });
  }
  await LotesService.identificarUnidade({ veiculoId: 'unit', chassi: ' X ', placa: '  ' });
  expectRpc('identificar_unidade_lote', { p_veiculo_id: 'unit', p_chassi: 'X', p_placa: null });
  await LotesService.cancelarVenda('sale');
  expectRpc('cancelar_venda_lote', { p_venda_id: 'sale' });
  await LotesService.encerrar('batch');
  expectRpc('encerrar_lote', { p_lote_id: 'batch' });

  handler = () => ({ body: [{ id: 'mine', organization_id: 'org-a' }, { id: 'other', organization_id: 'org-b' }] });
  const listing = await LotesService.listar('purchase', { search: '  moto  ', statusTab: 'DISPONIVEL', montadoraId: 'brand', tipoId: 'motorcycle' });
  assert.deepEqual(listing.map(item => item.id), ['mine']);
  expectRpc('listar_lotes', { p_pedido_id: 'purchase', p_search: 'moto', p_status: 'DISPONIVEL', p_montadora_id: 'brand', p_tipo_id: 'motorcycle' });
  globalThis.__lotesOrg = null;
  requests = [];
  assert.deepEqual(await LotesService.listar(), []);
  await assert.rejects(() => LotesService.getCatalogos(), /Selecione uma empresa/);
  assert.equal(requests.length, 0);
  globalThis.__lotesOrg = 'org-a';

  handler = request => ({ body: [{ id: request.url.pathname.split('/').at(-1) }] });
  requests = [];
  const catalogs = await LotesService.getCatalogos();
  assert.equal(requests.length, 4);
  const byTable = Object.fromEntries(requests.map(request => [request.url.pathname.split('/').at(-1), request.url.searchParams]));
  for (const table of ['parceiros', 'fin_categorias', 'fin_contas_bancarias']) {
    assert.equal(byTable[table].get('organization_id'), 'eq.org-a', table + ' deve restringir organização');
  }
  for (const table of ['parceiros', 'fin_contas_bancarias', 'cad_formas_pagamento']) assert.equal(byTable[table].get('ativo'), 'eq.true');
  assert.equal(byTable.fin_categorias.get('natureza'), 'eq.SAIDA');
  assert.equal(byTable.fin_categorias.get('tipo'), 'eq.VARIAVEL');
  assert.equal(byTable.cad_formas_pagamento.get('or'), '(organization_id.eq.org-a,organization_id.is.null)');
  assert.deepEqual(Object.keys(catalogs), ['parceiros', 'categorias', 'contas', 'formas']);

  // Não apresentar falha de acesso/rede como lote sem saldo ou catálogo vazio.
  handler = () => ({ status: 403, body: { code: '42501', message: 'Acesso recusado', details: null, hint: null } });
  for (const operation of [
    () => LotesService.listar(), () => LotesService.getById('batch'), () => LotesService.registrarVenda('batch', sale, 'request'),
    () => LotesService.registrarDespesa('batch', expense, 'request'), () => LotesService.baixarTitulo(settlement),
    () => LotesService.cancelarVenda('sale'), () => LotesService.encerrar('batch'), () => LotesService.getCatalogos(),
  ]) await assert.rejects(operation, /Acesso recusado/);
  handler = () => ({ body: null });
  await assert.rejects(() => LotesService.getById('missing'), /Lote não encontrado/);
  // As telas financeiras antigas também roteiam títulos do lote com intenção estável.
  const previousStorage = globalThis.sessionStorage;
  const memoryStorage = new Map();
  globalThis.sessionStorage = {
    getItem: key => memoryStorage.get(key) || null,
    setItem: (key, value) => memoryStorage.set(key, value),
    removeItem: key => memoryStorage.delete(key),
  };
  try {
    const batchTitle = { id: 'partial-title', lote_id: 'batch' };
    handler = () => ({ status: 503, body: { message: 'Resposta indisponível', code: 'RETRY' } });
    requests = [];
    await assert.rejects(() => TitulosService.baixarTitulo(batchTitle, 20, 'bank', 'pix', 0, 0, '2026-10-24'), error => error.message === 'Resposta indisponível');
    const firstIntent = requests.at(-1).body.p_request_id;
    assert.match(firstIntent, /^[0-9a-f-]{36}$/);
    assert.equal(requests.at(-1).url.pathname, '/rest/v1/rpc/baixar_titulo_lote');
    assert.equal(memoryStorage.size, 1);
    assert.match([...memoryStorage.keys()][0], /^drivecar-lote-baixa:[0-9a-f]{64}$/);
    handler = () => ({ body: null });
    await TitulosService.baixarTitulo(batchTitle, 20, 'bank', 'pix', 0, 0, '2026-10-24');
    assert.equal(requests.at(-1).body.p_request_id, firstIntent, 'Repetição após erro preserva a intenção');
    assert.equal(memoryStorage.size, 0, 'Sucesso libera a intenção');
    await TitulosService.baixarTitulo(batchTitle, 20, 'bank', 'pix', 0, 0, '2026-10-24');
    assert.notEqual(requests.at(-1).body.p_request_id, firstIntent, 'Nova baixa após sucesso é nova intenção');
    requests = [];
    await assert.rejects(() => TitulosService.baixarTitulo(batchTitle, 20, 'bank', 'pix', 1), /Ajustes de valor/);
    assert.equal(requests.length, 0);
    handler = request => ({ body: request.method === 'GET' ? { lote_id: 'batch' } : null });
    await TitulosService.baixarTitulo({ id: 'unknown-lot-title' }, 10, 'bank', 'pix', 0, 0, '2026-10-24');
    assert.equal(requests.at(-2).method, 'GET', 'Título sem metadado consulta a origem');
    assert.equal(requests.at(-1).url.pathname, '/rest/v1/rpc/baixar_titulo_lote');
    requests = [];
    await TitulosService.baixarTitulo({ id: 'legacy', lote_id: null }, 10, 'bank', 'pix', 0, 0, '2026-10-24');
    expectRpc('baixar_titulo', { p_titulo_id: 'legacy', p_valor: 10, p_conta_id: 'bank',
      p_forma_pagamento_id: 'pix', p_data_pagamento: '2026-10-24', p_desconto: 0, p_acrescimo: 0 });
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previousStorage;
  }
  console.log('OK: RPCs, parâmetros, retries idempotentes, baixa lote/legada, catálogo por organização e erros propagados.');
} finally {
  delete globalThis.__lotesFetch;
  delete globalThis.__lotesOrg;
  await rm(temp, { recursive: true, force: true });
}
