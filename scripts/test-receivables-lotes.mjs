/** Offline PostgREST regression: synthetic responses, no network or mutations. */
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'drivecar-receivables-lotes-'));
const title = (id, overrides = {}) => ({ id, lote_id: null, descricao: 'Venda normal ' + id,
  tipo: 'RECEBER', status: 'PENDENTE', valor_total: 100, valor_pago: 0,
  valor_pendente: 100, valor_desconto: 0, data_emissao: '2026-11-01', data_vencimento: '2026-11-20',
  created_at: '2026-11-01T12:00:00Z', venda_pedido_id: 'sale-' + id, pedido_id: null,
  categoria_id: 'category', documento_ref: 'REF-' + id, origem_tipo: 'PEDIDO_VENDA', ...overrides });
const rows = Array.from({ length: 14 }, (_, index) => title('normal-' + String(index).padStart(2, '0')));
rows[0].descricao = 'Moto avulsa'; // Separação por vínculo ao lote, nunca pelo tipo do veículo.
rows[1] = title(rows[1].id, { status: 'PARCIAL', valor_pago: 20, valor_pendente: 80, categoria_id: 'other' });
rows[2] = title(rows[2].id, { status: 'ATRASADO', data_vencimento: '2026-11-10' });
rows.push(title('paid', { status: 'PAGO', valor_pago: 100, valor_pendente: 0 }),
  title('cancelled', { status: 'CANCELADO' }), title('payable', { tipo: 'PAGAR' }),
  title('unlinked', { categoria_id: null, venda_pedido_id: null }));
// Lotes competem com os normais por status, datas, categoria, descrição e paginação.
const lotRows = rows.filter(row => row.tipo === 'RECEBER' && row.id !== 'unlinked')
  .map(row => ({ ...row, id: 'lote-' + row.id, lote_id: 'batch' }));
rows.push(...lotRows);
const original = structuredClone(rows);
const requests = [];
try {
  await build({ stdin: { resolveDir: process.cwd(), loader: 'ts', contents: `
    export { ContasReceberService } from './modules/financeiro/submodules/contas-receber/contas-receber.service';
    export { LotesService } from './modules/lotes/lotes.service';
  ` }, bundle: true, platform: 'node', format: 'cjs', outfile: join(temp, 'services.cjs'), logLevel: 'silent',
  plugins: [{ name: 'offline-client', setup(build) {
    build.onLoad({ filter: /lib\/supabase\.ts$/ }, () => ({ loader: 'ts', contents: `
      import { createClient } from '@supabase/supabase-js';
      export const supabase = createClient('https://receivables.test', 'test', {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (...args) => globalThis.__receivablesLotesFetch(...args) }
      });` }));
  } }], });
  globalThis.__receivablesLotesFetch = async (input, options) => {
    const url = new URL(input), params = url.searchParams;
    requests.push({ url, method: options.method });
    if (url.pathname.endsWith('/rpc/get_lote_detalhes')) {
      assert.deepEqual(JSON.parse(options.body), { p_lote_id: 'batch' });
      return Response.json({ lote: { id: 'batch' }, unidades: [], despesas: [], vendas: [], titulos: lotRows });
    }
    if (url.pathname.endsWith('/rpc/rpc_kpi_contas_receber')) return Response.json({ valor_total: 1400, total_recebido: 20, total_em_aberto: 1380 });
    assert.equal(url.pathname, '/rest/v1/fin_titulos');
    assert.equal(options.method, 'GET');
    assert.equal(params.get('lote_id'), 'is.null', 'Excluir lotes no servidor, antes de contar e paginar');
    assert.ok(params.getAll('or').some(value => value.includes('categoria_id.not.is.null,pedido_id.not.is.null,venda_pedido_id.not.is.null')),
      'Preservar o filtro original de vínculo mesmo ao pesquisar');
    assert.match(new Headers(options.headers).get('prefer'), /count=exact/);
    assert.equal(params.get('order'), 'data_vencimento.asc,id.asc');
    let filtered = rows.filter(row => row.lote_id === null && row.tipo === 'RECEBER'
      && row.status !== 'CANCELADO' && (row.categoria_id || row.pedido_id || row.venda_pedido_id));
    for (const [key, expression] of params) {
      if (!['status', 'categoria_id', 'data_vencimento'].includes(key)) continue;
      const [operator, ...parts] = expression.split('.'), value = parts.join('.');
      filtered = filtered.filter(row => operator === 'eq' ? row[key] === value : operator === 'neq' ? row[key] !== value
        : operator === 'gte' ? row[key] >= value : operator === 'lte' ? row[key] <= value : false);
    }
    for (const expression of params.getAll('or')) {
      if (expression.includes('descricao.ilike.')) {
        const value = expression.match(/descricao\.ilike\.%([^%]*)%/)[1].toLowerCase();
        filtered = filtered.filter(row => row.descricao.toLowerCase().includes(value) || row.documento_ref.toLowerCase().includes(value));
      }
    }
    filtered.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento) || a.id.localeCompare(b.id));
    const offset = Number(params.get('offset') || 0), limit = Number(params.get('limit'));
    return Response.json(filtered.slice(offset, offset + limit), { headers: { 'Content-Range': `0-0/${filtered.length}` } });
  };
  const { ContasReceberService: service, LotesService } = (await import(pathToFileURL(join(temp, 'services.cjs')).href)).default;
  const first = await service.getAll('EM_ABERTO', { page: 1, limit: 10 });
  const second = await service.getAll('EM_ABERTO', { page: 2, limit: 10 });
  assert.equal(first.count, 14); assert.equal(first.totalPages, 2);
  assert.equal(first.data.length, 10); assert.equal(second.data.length, 4);
  assert.equal(new Set([...first.data, ...second.data].map(row => row.id)).size, 14);
  for (const [tab, filters, expected] of [
    ['PAGOS', {}, ['paid']], ['TODOS', { busca: 'Moto avulsa' }, ['normal-00']],
    ['EM_ABERTO', { categoriaId: 'other' }, ['normal-01']],
    ['TODOS', { status: 'PARCIAL' }, ['normal-01']],
    ['EM_ABERTO', { dataInicio: '2026-11-01', dataFim: '2026-11-15' }, ['normal-02']],
    ['TODOS', { busca: 'REF-normal-01', categoriaId: 'other', status: 'PARCIAL', dataInicio: '2026-11-20', dataFim: '2026-11-20' }, ['normal-01']],
    ['TODOS', { busca: 'inexistente' }, []], ['PAGOS', { status: 'PENDENTE' }, []],
  ]) {
    const result = await service.getAll(tab, { ...filters, limit: 100 });
    assert.deepEqual(result.data.map(row => row.id), expected);
    assert.equal(result.count, expected.length);
    assert.equal(result.totalPages, expected.length ? 1 : 0);
  }
  assert.equal((await service.getAll('TODOS', { limit: 100 })).count, 15);
  assert.deepEqual(await service.getKpis(), { valor_total: 1400, total_recebido: 20, total_em_aberto: 1380 });
  const lot = await LotesService.getById('batch');
  assert.deepEqual(lot.titulos, lotRows, 'Lotes conserva pendentes, parciais, pagos e histórico cancelado');
  assert.deepEqual(rows, original, 'Nenhum título é editado/excluído ao separar as consultas');
  assert.ok(requests.every(({ url, method }) => method === 'GET' || /\/rpc\/(get_lote_detalhes|rpc_kpi_contas_receber)$/.test(url.pathname)));
  console.log('PASS: receber separado em 3 abas, 2 páginas, busca, categoria, status, datas e filtros combinados; moto avulsa e contas de lotes preservadas.');
} finally {
  delete globalThis.__receivablesLotesFetch;
  await rm(temp, { recursive: true, force: true });
}
