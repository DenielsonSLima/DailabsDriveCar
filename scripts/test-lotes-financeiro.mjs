import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const temp = await mkdtemp(join(tmpdir(), 'lotes-financeiro-'));
const title = (id, extra = {}) => ({ id, lote_id: 'lote', venda_pedido_id: 'venda', origem_tipo: 'PEDIDO_VENDA', tipo: 'RECEBER', status: 'PENDENTE', valor_total: 100, valor_pago: 0, data_vencimento: '2026-11-01', parcela_numero: 1, parcela_total: 1, descricao: 'Parcela teste', ...extra });
const details = { lote: { id: 'lote', organization_id: 'org', descricao: 'Lote teste' }, unidades: [], despesas: [], vendas: [{ id: 'venda', lote_id: 'lote', status: 'CONCLUIDO', cliente_nome: 'Cliente teste', numero_venda: '10' }, { id: 'rascunho', lote_id: 'lote', status: 'RASCUNHO' }], titulos: [title('aberto'), title('pago', { valor_pago: 100, status: 'PAGO' }), title('estranho', { lote_id: 'outro' }), title('sem-lote', { lote_id: null }), title('cancelado', { status: 'CANCELADO' }), title('compra', { tipo: 'PAGAR' }), title('rascunho', { venda_pedido_id: 'rascunho' }), title('manual', { origem_tipo: 'MANUAL' })] };
try {
  await build({ entryPoints: ['modules/lotes/lotes.financeiro.ts'], bundle: true, platform: 'node', format: 'cjs', outfile: join(temp, 'model.cjs'), logLevel: 'silent' });
  const { getRecebiveisLote } = (await import(pathToFileURL(join(temp, 'model.cjs')))).default;
  assert.deepEqual(getRecebiveisLote(details).map(x => x.titulo.id), ['aberto']);
  assert.deepEqual(getRecebiveisLote(details, 'QUITADOS').map(x => x.titulo.id), ['pago']);
  assert.equal(getRecebiveisLote(details, 'TODOS').length, 2);
  assert.equal(getRecebiveisLote({ ...details, titulos: [title('parcial', { valor_pago: 40, valor_acrescimo: 10, valor_desconto: 5 })] })[0].pendente, 65);
  assert.equal(getRecebiveisLote({ ...details, titulos: [title('servidor', { valor_pendente: 12 })] })[0].pendente, 12);
  const { Window } = await import(process.env.HAPPY_DOM_MODULE || 'happy-dom');
  const window = new Window({ url: 'http://localhost', settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
  window.fetch = () => { throw new Error('Network forbidden'); };
  window.document.body.innerHTML = '<div id="root"></div>';
  const result = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react'; import { createRoot } from 'react-dom/client';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import {MemoryRouter,useNavigate,useLocation} from 'react-router-dom';
    function Probe(){globalThis.__navigate=useNavigate();globalThis.__location=useLocation().search;return null;} import LoteFinanceiro from './modules/lotes/components/details/LoteFinanceiro';
    const initial = ${JSON.stringify(details)};
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    globalThis.__refresh = 0;
    function App() { const [data, setData] = React.useState(initial); return <QueryClientProvider client={client}><LoteFinanceiro detalhes={data} canCreate={true} onUpdated={() => {if(globalThis.__failRefresh) throw new Error('offline refresh'); globalThis.__refresh++; setData({...data, titulos: data.titulos.map(t => t.id === 'aberto' ? {...t, valor_pago:100, status:'PAGO'} : t)});}} /></QueryClientProvider>; }
    createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/?aba=financeiro']}><Probe/><App/></MemoryRouter>);
  ` }, bundle: true, write: false, format: 'iife', logLevel: 'silent', plugins: [{ name: 'offline', setup(b) {
    b.onLoad({ filter: /lotes\.financeiro\.service\.ts$/ }, () => ({ loader: 'ts', contents: `export const LoteFinanceiroService = { getRecebimento: async (lote,id) => {globalThis.__history=[lote,id]; return {id};} };` }));
    b.onLoad({ filter: /ModalBaixa\.tsx$/ }, () => ({ loader: 'tsx', contents: `import React from 'react'; export default ({titulo,onSuccess,onClose}) => <div role="dialog"><span>Baixa {titulo.id}</span><button onClick={onSuccess}>Confirmar teste</button><button onClick={onClose}>Cancelar teste</button></div>;` }));
    b.onLoad({ filter: /ReceberQuickView\.tsx$/ }, () => ({ loader: 'tsx', contents: `import React from 'react'; export default ({readOnly,onClose}) => <div role="dialog">Histórico {readOnly ? 'somente leitura' : 'editável'}<button onClick={onClose}>Fechar histórico</button></div>;` }));
    b.onLoad({ filter: /lib\/supabase\.ts$/ }, () => { throw new Error('Real Supabase forbidden'); });
  } }] });
  window.eval(result.outputFiles[0].text);
  const flush = () => new Promise(r => setTimeout(r, 100));
  const click = async text => { const btn = [...window.document.querySelectorAll('button')].find(b => b.textContent.includes(text)); assert.ok(btn, text); btn.click(); await flush(); };
  const text = () => window.document.body.textContent;
  await flush(); assert.match(text(), /Em aberto/); assert.equal(window.document.querySelectorAll('section > div.grid > button').length, 1);
  await click('Cliente teste'); assert.match(window.__location,/recebimento=aberto/); assert.equal(window.document.activeElement.tagName, 'H3'); assert.match(text(), /Voltar ao financeiro/); assert.match(text(), /Caminho|Venda #10/);
  await flush(); assert.match(text(), /Histórico de recebimentos/); assert.deepEqual(Array.from(window.__history), ['lote','aberto']);
  await click('Baixar título'); assert.match(window.__location,/acao=baixar/); window.__navigate(-1); await flush(); assert.equal(window.document.querySelector('[role=dialog]'),null); window.__navigate(1); await flush(); assert.ok(window.document.querySelector('[role=dialog]')); await click('Cancelar teste'); assert.doesNotMatch(window.__location,/acao=baixar/); assert.match(text(), /Voltar ao financeiro/); assert.equal(window.__refresh, 0);
  window.__failRefresh = true; await click('Baixar título'); await click('Confirmar teste'); assert.equal(window.__refresh, 0);
  assert.match(text(), /Atualize o saldo/); assert.equal([...window.document.querySelectorAll('button')].find(b => b.textContent.includes('Baixar título')).disabled, true);
  window.__failRefresh = false; await click('Atualizar saldo'); assert.equal(window.__refresh, 1); assert.doesNotMatch(text(), /Baixar título/);
  await click('Voltar ao financeiro'); assert.doesNotMatch(window.__location,/recebimento=/); assert.match(text(), /Nenhum recebimento em aberto/); await click('Quitados'); assert.equal(window.document.querySelectorAll('section > div.grid > button').length, 2);
  window.happyDOM.abort();
  console.log('PASS: lote financeiro isolation, balances, navigation, history, cancel and post-payment refresh (offline).');
} finally { await rm(temp, { recursive: true, force: true }); }
