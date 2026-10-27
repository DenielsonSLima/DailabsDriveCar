import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// This harness imports only presentation components and pure helpers. No page,
// service, credentials, or remote client may enter the bundle.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'drivecar-lotes-management-ui-'));
try {
  const outfile = join(temp, 'checks.cjs');
  const bundle = await build({
    stdin: { resolveDir: root, loader: 'tsx', contents: String.raw`
import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LoteVendaForm, LoteDespesaForm, LoteBaixaForm } from './modules/lotes/components/LoteForms';
import { buscarUnidadesVendaLote, calcularPreviaVendaLote } from './modules/lotes/components/LoteVendaForm';
import LoteUnidades, { filtrarUnidadesLote } from './modules/lotes/components/details/LoteUnidades';
import LoteContas, { getContextoTituloLote } from './modules/lotes/components/details/LoteContas';
import LoteDespesas from './modules/lotes/components/details/LoteDespesas';
import LoteOperacaoForm from './modules/lotes/components/LoteOperacaoForm';
import { calcularIndicadoresLote } from './modules/lotes/lotes.utils';

const unidades = [
  { id: 'u-01', lote_id: 'lote', lote_ordem: 1, status: 'DISPONIVEL', placa: 'AAA1A01', chassi: 'CHASSI-01', valor_custo: 6080, valor_custo_servicos: 200 },
  { id: 'u-35', lote_id: 'lote', lote_ordem: 35, status: 'DISPONIVEL', placa: 'BBB3B35', chassi: 'CHASSI-35', valor_custo: 7000, valor_custo_servicos: 450.25 },
  { id: 'u-36', lote_id: 'lote', lote_ordem: 36, status: 'DISPONIVEL', placa: null, chassi: null, valor_custo: 6080, valor_custo_servicos: 200 },
  { id: 'u-50', lote_id: 'lote', lote_ordem: 50, status: 'VENDIDO', placa: 'CCC5C50', chassi: 'CHASSI-50', valor_custo: 6080, valor_custo_servicos: 200 },
] as any;
const catalogos = {
  parceiros: [{id:'maria', nome:'Maria Souza', tipo:'CLIENTE'}, {id:'joao', nome:'João Lima', tipo:'CLIENTE'}, {id:'fornecedor', nome:'Oficina Central', tipo:'FORNECEDOR'}],
  categorias: [{id:'mecanica', nome:'Mecânica'}], contas:[{id:'banco', banco_nome:'Conta local', conta:'0001', titular:'Teste'}],
  formas: [{id:'pix', nome:'Pix', tipo_movimentacao:'AMBOS', destino_lancamento:'CAIXA'}, {id:'boleto', nome:'Boleto', tipo_movimentacao:'RECEBIMENTO', destino_lancamento:'CONTAS_RECEBER'}],
};
const lote = {id:'lote', organization_id:'local', pedido_id:'pedido', descricao:'Lote das motos', quantidade_inicial:4, custo_aquisicao:25240, encerrado:false, created_at:'2026-10-20T12:00:00Z'};
const vendas = [
  {id:'venda-maria', lote_id:'lote', numero_venda:'LT-MARIA', cliente_id:'maria', cliente_nome:'Maria Souza', data_venda:'2026-10-25', quantidade_lote:1, valor_venda:9000, status:'CONCLUIDO', created_at:'2026-10-25T12:00:00Z', itens:[{venda_id:'venda-maria',veiculo_id:'u-50',lote_id:'lote',custo_na_venda:6280,valor_venda:9000}]},
  {id:'venda-joao', lote_id:'lote', numero_venda:'LT-JOAO', cliente_id:'joao', cliente_nome:'João Lima', data_venda:'2026-10-25', quantidade_lote:1, valor_venda:9000, status:'CONCLUIDO', created_at:'2026-10-25T12:00:00Z'},
] as any;
const title = (id, sale, pessoa) => ({id, venda_pedido_id:sale, parceiro_id:pessoa, lote_id:'lote', descricao:'Venda do lote: Lote das motos', tipo:'RECEBER', origem_tipo:'PEDIDO_VENDA', valor_total:3000, valor_pago:0, valor_pendente:3000, status:'PENDENTE', parcela_numero:2, parcela_total:3, data_emissao:'2026-10-25', data_vencimento:'2026-11-25', created_at:'2026-10-25T12:00:00Z'});
const maria = title('receber-maria', 'venda-maria', 'maria') as any;
const joao = title('receber-joao', 'venda-joao', 'joao') as any;
const despesa = {id:'despesa', lote_id:'lote', titulo_id:'pagar-despesa', descricao:'Conserto da unidade 35', valor_total:450.25, data_vencimento:'2026-11-10', categoria_id:'mecanica', fornecedor_id:'fornecedor', veiculo_id:'u-35', comprovante_url:'https://example.invalid/comprovante', created_at:'2026-10-24T12:00:00Z'};
const despesaTitle = {id:'pagar-despesa', lote_id:'lote', descricao:despesa.descricao, tipo:'PAGAR', origem_tipo:'DESPESA_LOTE', valor_total:450.25, valor_pago:0, valor_pendente:450.25, status:'PENDENTE', parcela_numero:1, parcela_total:1, data_emissao:'2026-10-24', data_vencimento:'2026-11-10', created_at:'2026-10-24T12:00:00Z'};
const details = {lote, unidades, despesas:[despesa], vendas, titulos:[despesaTitle, maria, joao]} as any;
let callbacks = 0;
const onClose = () => {callbacks++;};
const onSave = async () => {callbacks++;};
const render = element => renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
const buttons = (markup, label) => [...markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].filter(match => match[2] === label);
const assertAction = (markup, label, enabled) => {
  const actions = buttons(markup,label);
  assert.equal(actions.length,1, 'one action: ' + label);
  assert.equal(/\bdisabled(?:=|\s|$)/.test(actions[0][1]), !enabled, 'enabled state: ' + label);
};

// A physical unit with individual expenses must determine its own expected
// result; selecting #35 may never use the cheaper cost of the first unit.
const selection = buscarUnidadesVendaLote(unidades, '#35');
assert.deepEqual(selection.map(unit=>unit.id), ['u-35']);
assert.deepEqual(buscarUnidadesVendaLote(unidades, 'bbb3b35').map(unit=>unit.id), ['u-35']);
assert.deepEqual(buscarUnidadesVendaLote(unidades, 'chassi-35').map(unit=>unit.id), ['u-35']);
assert.deepEqual(calcularPreviaVendaLote(selection, 9000), {quantidade:1,custo:7450.25,total:9000,resultado:1549.75,margem:1549.75/9000*100});
assert.equal(calcularPreviaVendaLote(selection, 7000).resultado,-450.25);
assert.deepEqual(calcularPreviaVendaLote([],0),{quantidade:0,custo:0,total:0,resultado:0,margem:null});
assert.equal(calcularPreviaVendaLote([unidades[0], unidades[1]],9000).custo,13730.25);

// Search in the units ledger covers both identifiers and honors status.
assert.deepEqual(filtrarUnidadesLote(unidades,'#0035','TODAS').map(unit=>unit.id),['u-35']);
assert.deepEqual(filtrarUnidadesLote(unidades,'BBB3B35','DISPONIVEL').map(unit=>unit.id),['u-35']);
assert.deepEqual(filtrarUnidadesLote(unidades,'CHASSI-35','VENDIDO'),[]);
assert.deepEqual(filtrarUnidadesLote(unidades,'u-50','VENDIDO').map(unit=>unit.id),['u-50']);
const ledger = render(<LoteUnidades unidades={unidades} vendas={vendas} encerrado={false} onIdentificar={onClose} />);
for(const value of ['BBB3B35','CHASSI-35','LT-MARIA','Maria Souza']) assert.ok(ledger.includes(value),value);
const closedLedger=render(<LoteUnidades unidades={[unidades[0]]} encerrado onIdentificar={onClose}/>);
assertAction(closedLedger,'Identificar',false);

// Identical amounts and dates must remain distinguishable by person + sale.
const mariaContext = getContextoTituloLote(maria,vendas,catalogos);
const joaoContext = getContextoTituloLote(joao,vendas,catalogos);
assert.notEqual(mariaContext,joaoContext);
for(const text of ['Maria Souza','LT-MARIA','Parcela 2/3','25/11/2026']) assert.ok(mariaContext.includes(text),text);
for(const text of ['João Lima','LT-JOAO']) assert.ok(joaoContext.includes(text),text);
const accounts=render(<LoteContas title="Recebimentos" titulos={[maria,joao]} vendas={vendas} catalogos={catalogos} canCreate onBaixar={onClose}/>);
for(const text of ['Maria Souza','João Lima','LT-MARIA','LT-JOAO']) assert.ok(accounts.includes(text),text);

// Opening the sale never selects or sells a unit. Only available physical
// units are offered, with both identifiers and their current costs.
const sale=render(<LoteVendaForm catalogos={catalogos} unidades={unidades} onSave={onSave} onClose={onClose}/>);
const checkboxes=[...sale.matchAll(/<input\b[^>]*type="checkbox"[^>]*>/g)].map(match=>match[0]);
assert.equal(checkboxes.length,3);
assert.ok(checkboxes.every(input=>!/\bchecked(?:=|\s|>)/.test(input)));
for(const text of ['BBB3B35','CHASSI-35','7.450,25','Custo atualizado das selecionadas','Margem sobre a venda']) assert.ok(sale.includes(text),text);
assert.ok(!sale.includes('CCC5C50'));
assert.doesNotMatch(sale,/<span>Quantidade<\/span>/);
assertAction(sale,'Confirmar venda',false);

const edit=render(<LoteDespesaForm catalogos={catalogos} unidades={unidades} defaults={despesa as any} onSave={onSave} onClose={onClose}/>);
for(const text of ['Corrigir despesa','Conserto da unidade 35','450.25','Motivo da correção','Salvar correção']) assert.ok(edit.includes(text),text);
assert.match(edit,/<textarea\b(?=[^>]*required)(?=[^>]*minLength="5")[^>]*>/);
assert.doesNotMatch(edit,/Despesa paga agora/);

const renderExpense=(modified) => render(<LoteDespesas detalhes={modified} stats={calcularIndicadoresLote(modified)} canCreate onPagar={onClose} onAdicionar={onClose} onEditarDespesa={onClose} onCancelarDespesa={onClose}/>);
const unpaid=renderExpense(details);
assertAction(unpaid,'Editar',true); assertAction(unpaid,'Cancelar',true); assertAction(unpaid,'Pagar',true);
const paidDetails={...details,titulos:[{...despesaTitle,valor_pago:100,valor_pendente:350.25,status:'PARCIAL'},maria,joao]};
const paid=renderExpense(paidDetails);
assertAction(paid,'Editar',false); assertAction(paid,'Cancelar',false);
assert.match(paid,/Estorne os pagamentos/);
const canceled=renderExpense({...details,despesas:[{...despesa,cancelada:true}],titulos:[{...despesaTitle,status:'CANCELADO',valor_pendente:0}]});
assertAction(canceled,'Editar',false); assertAction(canceled,'Cancelar',false);
assert.equal(buttons(canceled,'Pagar').length,0);
assert.match(canceled,/fora do custo ativo/);
const closed=renderExpense({...details,lote:{...lote,encerrado:true}});
assertAction(closed,'Editar',false); assertAction(closed,'Cancelar',false); assertAction(closed,'Adicionar despesa',false);

const settlement=render(<LoteBaixaForm titulo={maria} catalogos={catalogos} pendente={3000} contexto={mariaContext} onSave={onSave} onClose={onClose}/>);
for(const text of ['Maria Souza','LT-MARIA','Parcela 2/3','25/11/2026','3.000,00']) assert.ok(settlement.includes(text),text);
assert.match(settlement,/max="3000"/);
const operation=render(<LoteOperacaoForm title="Estornar pagamento" description="Revise o pagamento antes de estornar." showDate minimumDate="2026-10-01" onSave={onSave} onClose={onClose}/>);
assert.match(operation,/<textarea\b(?=[^>]*required)(?=[^>]*minLength="5")[^>]*>/);
assert.match(operation,/min="2026-10-01"/);
assert.match(operation,/role="dialog"/);
assert.equal(callbacks,0,'SSR must not trigger saving, identification, canceling, settlement, or closing');
console.log('OK: seleção física/custo individual/prejuízo; busca e vínculo de venda; parcelas com cliente/origem; formulários sem seleção automática; motivo obrigatório e bloqueios de correção; contexto de baixa. Nenhum serviço remoto importado.');
` },
    bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', metafile: true,
    plugins: [{ name: 'management-ui-offline-only', setup(bundler) {
      bundler.onResolve({ filter: /(?:lib\/supabase|lotes\.service|@supabase\/)/ }, () => { throw new Error('Management UI tests must never import a remote client or service.'); });
      bundler.onLoad({ filter: /modules\/lotes\/components\/LoteUi\.tsx$/ }, async args => ({
        contents: (await readFile(args.path, 'utf8')).replace("import { createPortal } from 'react-dom';", 'const createPortal = (children: React.ReactNode, _container?: unknown) => children;').replace(', document.body);', ', undefined);'),
        loader: 'tsx',
      }));
    } }],
  });
  assert.ok(!Object.keys(bundle.metafile.inputs).some(path => /(?:lib\/supabase|lotes\.service|@supabase\/)/.test(path)));
  await import(pathToFileURL(outfile).href);
} finally {
  await rm(temp, { recursive: true, force: true });
}
