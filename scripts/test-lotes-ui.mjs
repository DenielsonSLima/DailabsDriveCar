import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Only local, in-memory fixtures are bundled. The production service is replaced
// before esbuild follows its imports; importing Supabase fails this harness.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'drivecar-lotes-ui-'));
const preview = process.argv.includes('--preview');

const mockService = String.raw`
const today = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
};
const clone = value => structuredClone(value);
let sequence = 0;
const callbacks = new Set();
const requests = new Map();
const id = prefix => prefix + '-' + (++sequence);
export const catalogos = {
  parceiros: [{ id: 'cliente', nome: 'Cliente de teste', tipo: 'CLIENTE' }, { id: 'fornecedor', nome: 'Fornecedor de teste', tipo: 'FORNECEDOR' }],
  categorias: [{ id: 'frete', nome: 'Frete' }, { id: 'mecanica', nome: 'Mecânica' }],
  contas: [{ id: 'conta', banco_nome: 'Conta de teste', conta: '0001', titular: 'Ambiente local' }],
  formas: [{ id: 'pix', nome: 'PIX de teste', tipo_movimentacao: 'AMBOS', destino_lancamento: 'CAIXA' },
    { id: 'prazo', nome: 'Prazo de teste', tipo_movimentacao: 'RECEBIMENTO', destino_lancamento: 'CONTAS_RECEBER' },
    { id: 'troca', nome: 'Troca (não deve aparecer)', tipo_movimentacao: 'RECEBIMENTO', destino_lancamento: 'ATIVO' }],
};
function title(data) {
  const paid = data.valor_pago || 0;
  return { id: id('titulo'), descricao: '', tipo: 'PAGAR', status: paid === data.valor_total ? 'PAGO' : paid > 0 ? 'PARCIAL' : 'PENDENTE',
    valor_pago: paid, valor_liquidado: paid, valor_pendente: Math.round((data.valor_total - paid) * 100) / 100,
    data_emissao: today(), data_vencimento: today(), parcela_numero: 1, parcela_total: 1, created_at: new Date().toISOString(), ...data };
}
export const details = {
  gestao_versao: 2,
  lote: { id: 'demo-lote', organization_id: 'local', pedido_id: 'demo-pedido', descricao: 'Lote de 50 motos elétricas',
    quantidade_inicial: 50, custo_aquisicao: 304000, encerrado: false, created_at: new Date().toISOString() },
  unidades: Array.from({ length: 50 }, (_, index) => ({ id: 'unidade-' + (index + 1), lote_id: 'demo-lote', lote_ordem: index + 1,
    status: 'DISPONIVEL', valor_custo: 6080, valor_custo_servicos: 0, valor_venda: 0, is_consignado: false,
    placa: null, chassi: null, fotos: [], socios: [], ano_fabricacao: 2026, ano_modelo: 2027 })),
  despesas: [], vendas: [], transacoes: [], historico: [], titulos: [title({ descricao: 'Compra do lote de 50 motos', pedido_id: 'demo-pedido', origem_tipo: 'PEDIDO_COMPRA', valor_total: 304000, valor_pago: 304000 })],
};
function movement(titulo, valor, conta = 'conta') {
  const item = { id: id('movimento'), titulo_id: titulo.id, valor, conta_origem_id: conta, conta_nome: 'Conta de teste',
    tipo: titulo.tipo === 'PAGAR' ? 'SAIDA' : 'ENTRADA', tipo_transacao: 'RECEBIMENTO_TITULO', data_pagamento: new Date().toISOString() };
  details.transacoes.push(item); return item;
}
movement(details.titulos[0], 304000);
function audit(acao, motivo, antes, depois) { details.historico.push({ id: id('historico'), acao, motivo, antes, depois, created_at: new Date().toISOString() }); }
function refreshTitle(item) {
  item.valor_pago = Math.round(details.transacoes.filter(tx => tx.titulo_id === item.id).reduce((sum, tx) => sum + (tx.tipo === (item.tipo === 'PAGAR' ? 'SAIDA' : 'ENTRADA') ? tx.valor : -tx.valor), 0) * 100) / 100;
  item.valor_liquidado = item.valor_pago; item.valor_pendente = Math.round((item.valor_total - item.valor_pago) * 100) / 100;
  item.status = item.valor_pendente === 0 ? 'PAGO' : item.valor_pago > 0 ? 'PARCIAL' : 'PENDENTE';
}
function update() { for (const callback of callbacks) callback(); }
function once(requestId, action) {
  if (requestId && requests.has(requestId)) return requests.get(requestId);
  const result = action();
  if (requestId) requests.set(requestId, result);
  update(); return result;
}
function recalculateCosts() {
  for (const unit of details.unidades) unit.valor_custo_servicos = 0;
  for (const expense of details.despesas.filter(item => !item.cancelada)) {
    const units = expense.veiculo_id ? details.unidades.filter(unit => unit.id === expense.veiculo_id) : details.unidades;
    const cents = Math.round(expense.valor_total * 100);
    const base = Math.floor(cents / units.length);
    const remainder = cents % units.length;
    units.forEach((unit, index) => { unit.valor_custo_servicos = Math.round((unit.valor_custo_servicos * 100 + base + (index < remainder ? 1 : 0))) / 100; });
  }
}
export const LotesService = {
  listar: async () => [{ ...clone(details.lote), quantidade_disponivel: details.unidades.filter(unit => unit.status === 'DISPONIVEL').length,
    quantidade_vendida: details.unidades.filter(unit => unit.status === 'VENDIDO').length }],
  getById: async () => clone(details),
  getCatalogos: async () => clone(catalogos),
  subscribe: (_, callback) => { callbacks.add(callback); return () => callbacks.delete(callback); },
  criar: async () => { throw new Error('O lote demonstrativo já foi criado; nenhuma conexão de banco está presente.'); },
  registrarDespesa: async (_, data, requestId) => once(requestId, () => {
    if (!(data.valor_total > 0)) throw new Error('Informe um valor positivo.');
    const expenseId = id('despesa');
    const payable = title({ descricao: data.descricao, valor_total: data.valor_total, valor_pago: data.pago_agora ? data.valor_total : 0,
      origem_tipo: 'DESPESA_LOTE', origem_id: expenseId, data_vencimento: data.data_vencimento, forma_pagamento_id: data.forma_pagamento_id });
    details.despesas.push({ ...clone(data), id: expenseId, lote_id: details.lote.id, titulo_id: payable.id, created_at: new Date().toISOString() });
    details.titulos.push(payable);
    if (data.pago_agora) movement(payable, data.valor_total, data.conta_bancaria_id);
    recalculateCosts(); return expenseId;
  }),
  registrarVenda: async (_, data, requestId) => once(requestId, () => {
    const units = details.unidades.filter(unit => unit.status === 'DISPONIVEL' && data.veiculo_ids?.includes(unit.id));
    if (units.length !== data.quantidade || new Set(data.veiculo_ids).size !== data.quantidade || !Number.isInteger(data.quantidade) || data.quantidade < 1) throw new Error('Selecione as unidades disponíveis.');
    if (Math.round(data.pagamentos.reduce((sum, item) => sum + item.valor, 0) * 100) !== Math.round(data.valor_total * 100)) throw new Error('Os recebimentos precisam totalizar a venda.');
    const saleId = id('venda');
    const sale = { id: saleId, lote_id: details.lote.id, numero_venda: 'VENDA-LOCAL-' + (details.vendas.length + 1),
      cliente_id: data.cliente_id, cliente_nome: catalogos.parceiros.find(item => item.id === data.cliente_id)?.nome,
      data_venda: data.data_venda, quantidade_lote: data.quantidade, valor_venda: data.valor_total,
      status: 'CONCLUIDO', created_at: new Date().toISOString(), itens: units.map(unit => ({ venda_id: saleId, veiculo_id: unit.id,
        lote_id: details.lote.id, custo_na_venda: unit.valor_custo + unit.valor_custo_servicos, valor_venda: data.valor_total / data.quantidade })) };
    details.vendas.push(sale); units.forEach(unit => { unit.status = 'VENDIDO'; });
    for (const payment of data.pagamentos) {
      const received = payment.conta_bancaria_id && payment.data_recebimento <= today() ? payment.valor : 0;
      const receivable = title({ descricao: 'Venda ' + sale.numero_venda, tipo: 'RECEBER', origem_tipo: 'PEDIDO_VENDA', parceiro_id: data.cliente_id,
        venda_pedido_id: saleId, valor_total: payment.valor, valor_pago: received, data_vencimento: payment.data_recebimento,
        forma_pagamento_id: payment.forma_pagamento_id });
      details.titulos.push(receivable);
      if (received) movement(receivable, received, payment.conta_bancaria_id);
    }
    return saleId;
  }),
  baixarTitulo: async data => once(data.requestId, () => {
    const item = details.titulos.find(title => title.id === data.tituloId);
    if (!item || data.valor <= 0 || data.valor > item.valor_pendente) throw new Error('Valor acima do saldo em aberto.');
    movement(item, data.valor, data.contaId); refreshTitle(item); return item.id;
  }),
  corrigirDespesa: async (expenseId, data, motivo, requestId) => once(requestId, () => {
    const expense = details.despesas.find(item => item.id === expenseId);
    const payable = details.titulos.find(item => item.id === expense.titulo_id);
    if (payable.valor_pago > 0 || expense.cancelada) throw new Error('Estorne os pagamentos antes de corrigir.');
    const before = clone(expense); Object.assign(expense, clone(data));
    Object.assign(payable, { descricao: data.descricao, valor_total: data.valor_total, data_vencimento: data.data_vencimento });
    refreshTitle(payable); recalculateCosts(); audit('CORRIGIR_DESPESA', motivo, { despesa: before }, { despesa: clone(expense) }); return expense.id;
  }),
  cancelarDespesa: async (expenseId, motivo, requestId) => once(requestId, () => {
    const expense = details.despesas.find(item => item.id === expenseId);
    const payable = details.titulos.find(item => item.id === expense.titulo_id);
    if (payable.valor_pago > 0) throw new Error('Estorne os pagamentos antes de cancelar.');
    expense.cancelada = true; payable.status = 'CANCELADO'; payable.valor_pendente = 0;
    recalculateCosts(); audit('CANCELAR_DESPESA', motivo, { despesa: clone(expense) }, {}); return expense.id;
  }),
  estornarBaixa: async (txId, motivo, data, requestId) => once(requestId, () => {
    const original = details.transacoes.find(item => item.id === txId);
    if (!original || original.estorno_de_id || details.transacoes.some(item => item.estorno_de_id === txId)) throw new Error('Movimento já estornado.');
    const reversal = { ...clone(original), id: id('estorno'), estorno_de_id: original.id, tipo_transacao: 'ESTORNO_LOTE',
      tipo: original.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA', data_pagamento: data + 'T12:00:00' };
    details.transacoes.push(reversal); refreshTitle(details.titulos.find(item => item.id === original.titulo_id));
    audit('ESTORNAR_BAIXA', motivo, { transacao: clone(original) }, { transacao: reversal }); return reversal.id;
  }),
  devolverVenda: async (saleId, motivo, data, requestId) => once(requestId, () => {
    const sale = details.vendas.find(item => item.id === saleId);
    const titles = details.titulos.filter(item => item.venda_pedido_id === saleId);
    for (const payment of details.transacoes.filter(item => titles.some(title => title.id === item.titulo_id) && !item.estorno_de_id && !details.transacoes.some(tx => tx.estorno_de_id === item.id))) {
      details.transacoes.push({ ...clone(payment), id: id('devolucao'), estorno_de_id: payment.id, tipo_transacao: 'ESTORNO_LOTE', tipo: 'SAIDA', data_pagamento: data + 'T12:00:00' });
    }
    titles.forEach(item => { refreshTitle(item); item.status = 'CANCELADO'; item.valor_pendente = 0; });
    sale.status = 'CANCELADO'; sale.itens.forEach(line => { details.unidades.find(unit => unit.id === line.veiculo_id).status = 'DISPONIVEL'; });
    audit('DEVOLVER_VENDA', motivo, { venda: clone(sale) }, {}); return sale.id;
  }),
  identificarUnidade: async data => {
    const item = details.unidades.find(unit => unit.id === data.veiculoId);
    if (!item) throw new Error('Unidade não encontrada.');
    item.placa = data.placa; item.chassi = data.chassi; update();
  },
  cancelarVenda: async saleId => {
    const sale = details.vendas.find(item => item.id === saleId);
    const titles = details.titulos.filter(item => item.venda_pedido_id === saleId);
    if (titles.some(item => item.valor_pago > 0)) throw new Error('Venda com recebimentos exige devolução financeira antes do cancelamento.');
    sale.status = 'CANCELADO';
    titles.forEach(item => { item.status = 'CANCELADO'; item.valor_pendente = 0; });
    for (const line of sale.itens) details.unidades.find(unit => unit.id === line.veiculo_id).status = 'DISPONIVEL';
    update();
  },
  encerrar: async () => {
    if (details.unidades.some(unit => unit.status !== 'VENDIDO') || details.titulos.some(item => item.status !== 'CANCELADO' && item.valor_pendente > 0)) throw new Error('Ainda há estoque ou contas em aberto.');
    details.lote.encerrado = true; update();
  },
};
export function invalidarLotes(client) { return client.invalidateQueries({ queryKey: ['lote_detalhes'] }); }
`;

const sharedImports = `
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from './modules/lotes/LoteDetalhes.page';
import { details, catalogos, LotesService } from './modules/lotes/lotes.service';
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } });
function seed() {
  client.setQueryData(['lote_detalhes', 'demo-lote'], structuredClone(details));
  client.setQueryData(['lotes_catalogos'], structuredClone(catalogos));
}
seed();
const view = (aba = 'resumo') => <QueryClientProvider client={client}><MemoryRouter initialEntries={['/lotes/demo-lote?aba=' + aba]}><Routes><Route path="/lotes/:id" element={<Page />} /></Routes></MemoryRouter></QueryClientProvider>;
`;

function offlinePlugin(ssr = false) {
  return { name: 'lotes-offline-only', setup(bundler) {
    bundler.onLoad({ filter: /modules\/lotes\/lotes\.service\.ts$/ }, () => ({ contents: mockService, loader: 'ts' }));
    bundler.onLoad({ filter: /lib\/supabase\.ts$/ }, () => { throw new Error('The UI harness must never import the real Supabase client.'); });
    if (ssr) bundler.onLoad({ filter: /modules\/lotes\/components\/LoteUi\.tsx$/ }, async args => ({
      contents: (await readFile(args.path, 'utf8')).replace("import { createPortal } from 'react-dom';", 'const createPortal = (children: React.ReactNode, _container?: unknown) => children;').replace(', document.body);', ', undefined);'), loader: 'tsx',
    }));
  } };
}

try {
  const testFile = join(temp, 'test.cjs');
  const ssr = await build({ stdin: { resolveDir: root, loader: 'tsx', contents: `${sharedImports}
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoteVendaForm, LoteDespesaForm, LoteBaixaForm } from './modules/lotes/components/LoteForms';
import { getResumoLoteMedias } from './modules/lotes/components/details/LoteResumo';
import { separarContasLote } from './modules/lotes/components/details/LoteContas';
import { calcularIndicadoresLote } from './modules/lotes/lotes.utils';
export const testResult = (async () => {
const initial = renderToStaticMarkup(view());
assert.match(initial, /304\\.000,00/);
assert.match(initial, />50</);
assert.match(initial, /aria-pressed="true"[^>]*>Resumo/);
assert.doesNotMatch(initial, /<table/);
const entradaInicial = renderToStaticMarkup(view('entrada'));
assert.match(entradaInicial, /Unidades do lote/);
assert.match(entradaInicial, /Identificar/);
assert.match(entradaInicial, /304\\.000,00/);
assert.match(renderToStaticMarkup(view('despesas')), /Nenhuma despesa registrada/);
assert.match(renderToStaticMarkup(view('saidas')), /Nenhuma venda registrada/);
delete details.gestao_versao; seed();
const aguardandoBanco = renderToStaticMarkup(view('saidas'));
assert.match(aguardandoBanco, /O controle de lotes está sendo atualizado/);
assert.match(aguardandoBanco, /<button[^>]*disabled=""[^>]*>Registrar venda/);
details.gestao_versao = 2; seed();
assert.equal(getResumoLoteMedias(details, calcularIndicadoresLote(details)).venda, null);
const semUnidades = { ...details, unidades: [] };
assert.deepEqual(getResumoLoteMedias(semUnidades, calcularIndicadoresLote(semUnidades)), {
  compra: null, despesa: null, custo: null, venda: null, unidades: 0, unidadesVendidas: 0,
});
const today = new Date().toLocaleDateString('en-CA');
await LotesService.registrarDespesa('demo-lote', { descricao: 'Frete', valor_total: 10000, categoria_id: 'frete', data_vencimento: today, pago_agora: true }, 'despesa-1');
await LotesService.registrarDespesa('demo-lote', { descricao: 'Mecânica', valor_total: 6000, categoria_id: 'mecanica', data_vencimento: today, pago_agora: false }, 'despesa-2');
await LotesService.registrarVenda('demo-lote', { cliente_id: 'cliente', veiculo_ids: ['unidade-1','unidade-2','unidade-3'], quantidade: 3, valor_total: 27000, data_venda: today, pagamentos: [
  { valor: 12000, data_recebimento: today, conta_bancaria_id: 'conta', forma_pagamento_id: 'pix' },
  { valor: 15000, data_recebimento: today, conta_bancaria_id: null, forma_pagamento_id: 'pix' },
] }, 'venda-1');
seed();
const updated = renderToStaticMarkup(view());
assert.match(updated, />47</);
for (const amount of ['320.000,00', '27.000,00', '12.000,00', '15.000,00', '6.000,00']) assert.ok(updated.includes(amount), amount);
for (const amount of ['6.080,00', '320,00', '6.400,00', '9.000,00', '7.800,00']) assert.ok(updated.includes(amount), 'média/resultado ' + amount);
const comCanceladas = { ...details, vendas: [...details.vendas,
  { ...details.vendas[0], id: 'cancelada', status: 'CANCELADO', quantidade_lote: 10, valor_venda: 90000 },
  { ...details.vendas[0], id: 'rascunho', status: 'RASCUNHO', quantidade_lote: 20, valor_venda: 180000 },
] };
assert.deepEqual(getResumoLoteMedias(comCanceladas, calcularIndicadoresLote(comCanceladas)), {
  compra: 6080, despesa: 320, custo: 6400, venda: 9000, unidades: 50, unidadesVendidas: 3,
});
const contas = separarContasLote(details);
assert.equal(contas.entrada.length, 1);
assert.equal(contas.despesas.length, 2);
assert.equal(contas.saidas.length, 2);
assert.equal(new Set([...contas.entrada, ...contas.despesas, ...contas.saidas].map(item => item.id)).size, details.titulos.length);
const despesas = renderToStaticMarkup(view('despesas'));
assert.match(despesas, /Frete/); assert.match(despesas, /Mecânica/);
assert.doesNotMatch(despesas, /VENDA-LOCAL/);
const entrada = renderToStaticMarkup(view('entrada'));
assert.doesNotMatch(entrada, /Mecânica/);
assert.match(entrada, /Compra do lote de 50 motos/);
const saidas = renderToStaticMarkup(view('saidas'));
assert.match(saidas, /VENDA-LOCAL/);
assert.match(saidas, /15\\.000,00/);
assert.doesNotMatch(saidas, /Mecânica/);
assert.ok(!saidas.includes('Cancelar venda</button>'));
assert.match(saidas, /Devolver venda integral/);
assert.match(saidas, /Cliente de teste/);
const form = renderToStaticMarkup(<LoteVendaForm catalogos={catalogos as any} unidades={details.unidades as any} onSave={async () => {}} onClose={() => {}} />);
assert.match(form, /role="dialog"/); assert.match(form, /aria-modal="true"/);
assert.match(form, /47 disponíveis/); assert.match(form, /Entrada recebida agora/);
assert.match(form, /Unidades desta venda/); assert.match(form, /Custo atualizado das selecionadas/);
assert.doesNotMatch(form, /Troca \(não deve aparecer\)/);
const expenseForm = renderToStaticMarkup(<LoteDespesaForm catalogos={catalogos as any} unidades={details.unidades as any} onSave={async () => {}} onClose={() => {}} />);
assert.match(expenseForm, /Todo o lote/); assert.match(expenseForm, /Despesa paga agora/);
const pending = details.titulos.find(item => item.valor_pendente === 15000);
const settlementForm = renderToStaticMarkup(<LoteBaixaForm catalogos={catalogos as any} titulo={pending as any} pendente={15000} onSave={async () => {}} onClose={() => {}} />);
assert.match(settlementForm, /max="15000"/); assert.match(settlementForm, /pagamento parcial/);
assert.doesNotMatch(settlementForm, /Prazo de teste/);
console.log('OK: abas isoladas, contas por origem, médias sem canceladas/rascunhos e divisor zero; UI com 50 motos/R$304 mil, despesas de R$16 mil, venda de 3/R$27 mil, entrada de R$12 mil e saldo de R$15 mil; formulários e bloqueios preservados.');
})();
` }, bundle: true, platform: 'node', format: 'cjs', outfile: testFile, logLevel: 'silent', metafile: true, plugins: [offlinePlugin(true)], supported: { 'top-level-await': false } });
  assert.ok(!Object.keys(ssr.metafile.inputs).some(path => /lib\/supabase/.test(path)));
  const tests = await import(pathToFileURL(testFile).href);
  await tests.default.testResult;

  if (preview) {
    const target = join(root, 'scratch');
    await mkdir(target, { recursive: true });
    const bundle = await build({ stdin: { resolveDir: root, loader: 'tsx', contents: `${sharedImports}
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('lote-preview')).render(view());
` }, bundle: true, platform: 'browser', format: 'esm', outfile: join(target, 'lote-preview.js'), logLevel: 'silent', metafile: true,
      define: { 'process.env.NODE_ENV': '"development"' }, plugins: [offlinePlugin()] });
    assert.ok(!Object.keys(bundle.metafile.inputs).some(path => /lib\/supabase/.test(path)));
    const index = await readFile(join(root, 'index.html'), 'utf8');
    const style = index.match(/<style>[\s\S]*?<\/style>/)?.[0] || '';
    const fonts = index.match(/<link\s+href="https:\/\/fonts\.googleapis\.com[^>]+>/)?.[0] || '';
    await writeFile(join(target, 'lote-preview.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prévia local · Controle de lote</title><script src="https://cdn.tailwindcss.com"></script>${fonts}${style}</head><body><div class="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900">Prévia local de teste · dados em memória · nenhuma conexão ao banco</div><main class="mx-auto max-w-[1600px] px-4 py-6 sm:px-8"><div id="lote-preview"></div></main><script type="module" src="/scratch/lote-preview.js"></script></body></html>`);
    console.log('Prévia criada: http://localhost:3000/scratch/lote-preview.html');
    console.log('As alterações desta prévia existem somente na memória desta aba; recarregar restaura 50 motos, R$304 mil pagos e nenhum custo extra ou venda.');
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
