import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Usa o cliente PostgREST real com transporte simulado; não acessa o banco.
const temp = await mkdtemp(join(tmpdir(), 'drivecar-estoque-search-'));
try {
  await build({
    entryPoints: ['modules/estoque/estoque.service.ts'],
    bundle: true, platform: 'node', format: 'cjs',
    outfile: join(temp, 'service.cjs'), logLevel: 'silent',
    plugins: [{ name: 'offline-stock', setup(build) {
      build.onLoad({ filter: /lib\/supabase\.ts$/ }, () => ({
        loader: 'ts', contents: `
          import { createClient } from '@supabase/supabase-js';
          export const supabase = createClient('https://stock.test', 'test-key', {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { fetch: (...args) => globalThis.__stockFetch(...args) }
          });
        `
      }));
      build.onLoad({ filter: /ajustes\/empresa\/empresa\.service\.ts$/ }, () => ({
        loader: 'ts', contents: `export const EmpresaService = {
          getCurrentOrganizationId: async () => globalThis.__stockOrg
        };`
      }));
    } }],
  });
  const { EstoqueService } = (await import(pathToFileURL(join(temp, 'service.cjs')).href)).default;
  globalThis.__stockOrg = 'org-a';
  let requests = [];
  let batches = [];
  globalThis.__stockFetch = async (input, options) => {
    const url = new URL(input);
    requests.push({ url, options });
    const batch = batches.shift();
    assert.ok(batch, 'Consulta inesperada');
    return new Response(JSON.stringify(batch.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Content-Range': `0-0/${batch.count ?? batch.data.length}` }
    });
  };
  const filters = { page: 1, limit: 12, statusTab: 'DISPONIVEL' };
  const harley = {
    id: 'harley', placa: null, montadora: { nome: 'HARLEY-DAVIDSON' },
    modelo: { nome: 'MOTO ELETRICA' }, versao: { nome: 'ELETRICA' },
    valor_custo: 304000, valor_custo_servicos: 0, valor_total_investido: 304000,
    valor_venda: 330000, socios: [{ socio_id: 'partner', nome: 'Sócio', valor: 304000, porcentagem: 100 }]
  };

  // Regressão: montadora, modelo, versão e placa participam do OR, mesmo sem placa.
  for (const term of ['har', 'MOTO', 'ELETRICA', 'ABC1234', ' HAR ', 'x"),status.eq.VENDIDO', '50%_\\']) {
    batches = [{ data: [harley], count: 13 }];
    const result = await EstoqueService.getAll({ ...filters, search: term });
    assert.equal(result.data[0].montadora.nome, 'HARLEY-DAVIDSON');
    assert.equal(result.data[0].placa, null);
    assert.equal(result.count, 13);
    assert.equal(result.totalPages, 2);
    const params = requests.at(-1).url.searchParams;
    assert.equal(params.get('organization_id'), 'eq.org-a');
    assert.equal(params.get('status'), 'eq.DISPONIVEL');
    assert.equal(params.get('offset'), '0');
    assert.equal(params.get('limit'), '12');
    assert.ok(params.get('select').includes('busca_montadora:cad_montadoras()'));
    assert.ok(params.get('select').includes('montadora:cad_montadoras(nome,logo_url)'));
    assert.ok(!params.get('select').includes('!inner'), 'O OR não pode exigir todos os relacionamentos');
    const pattern = params.get('busca_modelo.nome');
    assert.equal(params.get('busca_montadora.nome'), pattern);
    assert.equal(params.get('busca_versao.nome'), pattern);
    const or = params.get('or');
    const quoted = or.match(/^\(placa\.ilike\.("(?:\\.|[^"\\])*"),/);
    assert.ok(quoted, 'O texto deve ficar dentro de um único valor delimitado');
    assert.equal('ilike.' + JSON.parse(quoted[1]), pattern);
    assert.ok(or.endsWith('busca_montadora.not.is.null,busca_modelo.not.is.null,busca_versao.not.is.null)'));
  }

  batches = [{ data: [], count: 0 }];
  const empty = await EstoqueService.getAll({ ...filters, search: 'inexistente', page: 2,
    statusTab: 'RASCUNHO', montadoraId: 'brand', tipoId: 'motorcycle' });
  assert.equal(empty.count, 0);
  let params = requests.at(-1).url.searchParams;
  assert.equal(params.get('offset'), '12');
  assert.equal(params.get('status'), 'eq.PREPARACAO');
  assert.equal(params.get('montadora_id'), 'eq.brand');
  assert.equal(params.get('tipo_veiculo_id'), 'eq.motorcycle');

  // Indicadores incluem o segundo lote, independentemente da página de cards.
  requests = [];
  const otherPartner = { ...harley, valor_custo: 100, valor_custo_servicos: 50,
    valor_total_investido: null, valor_venda: 200,
    socios: [{ socio_id: 'other', nome: 'Outro', valor: 100, porcentagem: 100 }] };
  batches = [{ data: Array.from({ length: 500 }, () => harley) }, { data: [otherPartner] }];
  const stats = await EstoqueService.getDashboardStats({ ...filters, search: 'har', page: 2 });
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map(r => r.url.searchParams.get('offset')), ['0', '500']);
  assert.equal(stats.count, 501);
  assert.equal(stats.totalCustoBase, 152000100);
  assert.equal(stats.totalServicos, 50);
  assert.equal(stats.totalInvestido, 152000150);
  assert.equal(stats.totalVenda, 165000200);
  assert.equal(stats.ticketMedioVenda, 165000200 / 501);
  assert.equal(stats.socioStats[0].count, 500);
  assert.equal(stats.socioStats[0].totalValor, 152000000);
  assert.equal(stats.socioStats[1].totalValor, 150);
  assert.ok(Math.abs(stats.socioStats.reduce((sum, p) => sum + p.percent, 0) - 100) < 1e-9);
  assert.ok(!requests[0].url.searchParams.get('select').includes('fotos'));

  batches = [{ data: [{ ...otherPartner, is_consignado: true,
    socios: [{ socio_id: 'other', nome: 'Outro', valor: 99999, porcentagem: 40 }] }] }];
  const consigned = await EstoqueService.getDashboardStats({ ...filters, search: 'har' });
  assert.equal(consigned.totalCustoBase, 0);
  assert.equal(consigned.totalServicos, 50);
  assert.equal(consigned.totalInvestido, 50);
  assert.equal(consigned.socioStats[0].totalValor, 20);
  assert.equal(consigned.socioStats[0].percent, 40);

  batches = [{ data: [], count: 0 }];
  const zeroStats = await EstoqueService.getDashboardStats({ ...filters, search: 'inexistente' });
  assert.equal(zeroStats.count, 0);
  assert.deepEqual(zeroStats.socioStats, []);

  batches = [{ data: [], count: 0 }];
  await EstoqueService.getAll({ ...filters, search: '   ', statusTab: 'TODOS' });
  params = requests.at(-1).url.searchParams;
  assert.equal(params.get('or'), null);
  assert.equal(params.get('status'), null);
  assert.ok(!params.get('select').includes('busca_'));

  batches = [{ data: { count: 22 } }];
  assert.equal((await EstoqueService.getDashboardStats({ ...filters, search: '   ' })).count, 22);
  assert.equal(requests.at(-1).url.pathname, '/rest/v1/rpc/get_estoque_dashboard_stats');
  assert.equal(JSON.parse(requests.at(-1).options.body).p_search, null);

  const before = requests.length;
  globalThis.__stockOrg = null;
  assert.equal((await EstoqueService.getAll({ ...filters, search: 'har' })).count, 0);
  assert.equal((await EstoqueService.getDashboardStats({ ...filters, search: 'har' })).count, 0);
  assert.equal(requests.length, before, 'Sem organização não deve consultar o estoque');
  assert.equal(batches.length, 0);
  console.log('OK: filtros PostgREST, texto delimitado, veículo sem placa, paginação, isolamento por organização e indicadores em múltiplos lotes.');
} finally {
  delete globalThis.__stockFetch;
  delete globalThis.__stockOrg;
  await rm(temp, { recursive: true, force: true });
}
