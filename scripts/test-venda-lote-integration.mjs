import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const temp = await mkdtemp(join(tmpdir(), 'drivecar-venda-lote-'));
try {
  await build({
    stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { getVendaCost, getVendaOriginalCost, getVendaValue, getVendaUnits, getVendaPartnerResults, getVendaReportItem } from './modules/pedidos-venda/utils/venda-values';
      import PedidoVendaCard from './modules/pedidos-venda/components/PedidoVendaCard';
      import PedidosVendaKpis from './modules/pedidos-venda/components/PedidosVendaKpis';
      import HeaderVenda from './modules/pedidos-venda/components/details/HeaderVenda';
      import VeiculosVendaList from './modules/pedidos-venda/components/details/VeiculosVendaList';
      import FinancialCard from './modules/pedidos-venda/components/details/FinancialCard';
      import VendasTemplate from './modules/relatorios/templates/vendas/VendasTemplate';
      const legacy = { id: 'legacy', veiculo_id: 'unit', status: 'CONCLUIDO', valor_venda: 9000,
        veiculo: { valor_custo: 6000, valor_custo_servicos: 400, socios: [{ socio_id: 'a', nome: 'Ana', porcentagem: 100 }] } };
      assert.equal(getVendaCost(legacy as any), 6400);
      assert.equal(getVendaUnits(legacy as any), 1);
      assert.equal(getVendaPartnerResults(legacy as any)[0].retorno, 2600);
      const lote = { ...legacy, id: 'sale', lote_id: 'batch', quantidade_lote: 3, data_venda: '2026-10-24',
        valor_venda: 27000, titulos: [{ tipo: 'RECEBER', origem_tipo: 'PEDIDO_VENDA', status: 'PARCIAL', valor_pago: 12000, valor_liquidado: 12000 }],
        pagamentos: [{ id: 'p', valor: 27000, data_recebimento: '2026-10-24' }],
        itens_lote: [0,1,2].map(index => ({ venda_id: 'sale', lote_id: 'batch', veiculo_id: 'unit' + index,
          custo_na_venda: 6400, valor_venda: 9000,
          veiculo: { id: 'unit' + index, chassi: 'CHASSI' + index, valor_custo: 304000, valor_custo_servicos: 9999,
            socios: [{ socio_id: 'a', nome: 'Ana', porcentagem: 33.33 }, { socio_id: 'b', nome: 'Bruno', porcentagem: 33.33 }, { socio_id: 'c', nome: 'Caio', porcentagem: 33.34 }] } })) };
      assert.equal(getVendaCost(lote as any), 19200, 'Custos históricos de todas as unidades, sem custo atual da primeira');
      assert.equal(getVendaUnits(lote as any), 3);
      assert.equal(getVendaValue(lote as any), 27000);
      const socios = getVendaPartnerResults(lote as any);
      assert.equal(socios.reduce((sum, socio) => sum + socio.investido, 0), 19200);
      assert.ok(Math.abs(socios.reduce((sum, socio) => sum + socio.retorno, 0) - 7800) < 0.00001);
      const report = getVendaReportItem(lote as any);
      assert.equal(report.lucro, 7800);
      assert.equal(report.quantidade, 3);
      for (const index of [0,1,2]) assert.ok(report.identificacoes.includes('CHASSI' + index));
      const late = { ...lote, valor_custo_veiculo: 20400 };
      assert.equal(getVendaCost(late as any), 20400, 'Despesa posterior usa custo agregado atualizado');
      assert.equal(getVendaOriginalCost(late as any), 19200, 'Referência histórica permanece disponível');
      assert.equal(getVendaReportItem(late as any).lucro, 6600);
      assert.ok(Math.abs(getVendaPartnerResults(late as any).reduce((sum, socio) => sum + socio.retorno, 0) - 6600) < 0.00001);
      const zeroHeader = { ...late, valor_custo_veiculo: 0 };
      assert.equal(getVendaCost(zeroHeader as any), 0, 'Agregado zero não pode cair no snapshot');
      const free = { ...lote, itens_lote: [{ ...lote.itens_lote[0], custo_na_venda: 0 }] };
      assert.equal(getVendaCost(free as any), 0, 'Snapshot zero não cai no custo do cadastro');
      const cents = { ...lote, itens_lote: [0.1, 0.2].map(custo_na_venda => ({ custo_na_venda })) };
      assert.equal(getVendaCost(cents as any), 0.3);
      const card = renderToStaticMarkup(<PedidoVendaCard pedido={lote as any} onClick={() => {}} />);
      assert.match(card, /3 unidades do lote/);
      assert.match(card, /19.200,00/);
      const kpis = renderToStaticMarkup(<PedidosVendaKpis pedidos={[lote, { ...lote, id: 'cancelled', status: 'CANCELADO' }] as any} />);
      assert.match(kpis, /3 Veículos Vendidos/);
      assert.match(kpis, /19.200,00/);
      assert.match(kpis, /7.800,00/);
      const header = renderToStaticMarkup(<HeaderVenda pedido={{ ...lote, status: 'RASCUNHO' } as any} onBack={() => {}} onEdit={() => {}} onConfirm={() => {}} onDelete={() => {}} loadingAction={false} />);
      assert.match(header, /Gerenciar lote/);
      assert.doesNotMatch(header, /Excluir|Editar Pedido|Faturar Venda/);
      const units = renderToStaticMarkup(<VeiculosVendaList pedido={lote as any} veiculosDisponiveis={[]} onLink={async () => {}} onUnlink={() => {}} isConcluido={true} />);
      for (const index of [0,1,2]) assert.ok(units.includes('CHASSI' + index));
      assert.doesNotMatch(units, /Adicionar Veículos/);
      const financial = renderToStaticMarkup(<FinancialCard pedido={{ ...lote, status: 'RASCUNHO' } as any} valorVendaEfetivo={27000} onAddPayments={() => {}} onDeletePayment={() => {}} isSaving={false} />);
      assert.doesNotMatch(financial, /Adicionar Lançamento|Excluir Lançamento/);
      const pdf = renderToStaticMarkup(<VendasTemplate empresa={{}} watermark={{}} data={{ items: [{ ...report, data: '24/10/2026' }], totalVendas: 27000, totalUnidades: 3, ticketMedio: 9000, lucroBruto: 7800 }} />);
      assert.match(pdf, /3 unidades/);
      assert.match(pdf, /CHASSI2/);
      console.log('OK: custo histórico multiunidades, centavos, sócios, cancelados, identificação, bloqueios e PDF.');
    ` },
    bundle: true, platform: 'node', format: 'cjs', outfile: join(temp, 'test.cjs'), logLevel: 'silent',
    plugins: [{ name: 'offline', setup(build) {
      build.onLoad({ filter: /lib\/supabase\.ts$/ }, () => ({ contents: 'export const supabase = {};', loader: 'ts' }));
    } }],
  });
  await import(pathToFileURL(join(temp, 'test.cjs')).href);
} finally {
  await rm(temp, { recursive: true, force: true });
}

// Transporte PostgREST real com respostas locais: nenhuma consulta remota.
const serviceTemp = await mkdtemp(join(tmpdir(), 'drivecar-venda-lote-service-'));
try {
  await build({ entryPoints: ['modules/pedidos-venda/pedidos-venda.service.ts'], bundle: true,
    platform: 'node', format: 'cjs', outfile: join(serviceTemp, 'service.cjs'), logLevel: 'silent',
    plugins: [{ name: 'offline-service', setup(build) {
      build.onLoad({ filter: /lib\/supabase\.ts$/ }, () => ({ loader: 'ts', contents: `
        import { createClient } from '@supabase/supabase-js';
        export const supabase = createClient('https://sales.test', 'test', {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { fetch: (...args) => globalThis.__salesFetch(...args) }
        });` }));
    } }],
  });
  const { PedidosVendaService } = (await import(pathToFileURL(join(serviceTemp, 'service.cjs')).href)).default;
  let responses = [];
  let requests = [];
  globalThis.__salesFetch = async (input, options) => {
    const url = new URL(input);
    requests.push({ url, method: options?.method || 'GET' });
    assert.ok(responses.length, 'Consulta inesperada');
    return new Response(JSON.stringify(responses.shift()), { status: 200,
      headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/1' } });
  };
  const filters = { busca: '', dataInicio: '', dataFim: '', corretorId: '', socioId: '' };
  const sale = { id: 'sale', lote_id: 'batch', quantidade_lote: 2, valor_venda: 20000,
    veiculo: { valor_custo: 304000, valor_custo_servicos: 0 },
    valor_custo_veiculo: 13000, itens_lote: [{ custo_na_venda: 6080 }, { custo_na_venda: 6080 }] };
  for (const getSale of [
    async () => { responses = [[sale]]; return (await PedidosVendaService.getAll(filters, 'TODOS')).data[0]; },
    async () => { responses = [[sale]]; return (await PedidosVendaService.getDashboardStats(filters, 'TODOS'))[0]; },
    async () => { responses = [sale]; return await PedidosVendaService.getById('sale'); },
  ]) {
    const result = await getSale();
    assert.equal(result.valor_custo_veiculo, 13000);
    assert.equal(result.valor_lucro, 7000);
    assert.equal(result.veiculo.valor_custo, 304000, 'Não sobrescrever o custo da primeira unidade');
    const select = requests.at(-1).url.searchParams.get('select');
    assert.ok(select.includes('itens_lote:venda_lote_itens('));
    assert.ok(select.includes('custo_na_venda'));
    assert.ok(!select.includes('venda_lote_itens(id,'), 'A tabela possui chave composta, sem coluna id');
  }
  const mutations = [
    () => PedidosVendaService.save({ id: 'sale', observacoes: 'changed' }),
    () => PedidosVendaService.confirmSale({ pedido: { id: 'sale' } }),
    () => PedidosVendaService.delete('sale'),
    () => PedidosVendaService.savePayment({ pedido_id: 'sale', valor: 10 }),
  ];
  for (const mutate of mutations) {
    requests = [];
    responses = [{ lote_id: 'batch' }];
    await assert.rejects(mutate, /Gerenciar lote/);
    assert.deepEqual(requests.map(r => r.method), ['GET'], 'Bloqueio deve ocorrer antes de escrever');
  }
  requests = [];
  responses = [{ pedido_id: 'sale' }, { lote_id: 'batch' }];
  await assert.rejects(() => PedidosVendaService.deletePayment('payment'), /Gerenciar lote/);
  assert.ok(requests.every(r => r.method === 'GET'));
  console.log('OK: joins multiunidades, totais agregados sem alterar veículo e guardas legacy sem escritas.');
} finally {
  await rm(serviceTemp, { recursive: true, force: true });
}
