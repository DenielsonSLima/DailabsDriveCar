// Real ModalBaixa + ReceberQuickView + TitulosService; only external services/RPC are mocked.
// Requires HAPPY_DOM_MODULE or a local happy-dom installation. No network or production writes.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { webcrypto } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const { Window } = await import(process.env.HAPPY_DOM_MODULE || 'happy-dom');
const titulo = { id: 'titulo-local', lote_id: 'lote-local', venda_pedido_id: 'venda-local', origem_tipo: 'PEDIDO_VENDA', tipo: 'RECEBER', status: 'PENDENTE', valor_total: 100, valor_pago: 0, valor_pendente: 100, valor_liquidado: 0, data_vencimento: '2026-11-15', parcela_numero: 1, parcela_total: 1, descricao: 'Recebível sintético', parceiro: { nome: 'Cliente sintético', documento: '' } };
const details = { lote: { id: 'lote-local', organization_id: 'org-local', descricao: 'Lote sintético' }, vendas: [{ id: 'venda-local', lote_id: 'lote-local', status: 'CONCLUIDO', numero_venda: '15', cliente_nome: 'Cliente sintético' }], despesas: [], unidades: [], titulos: [titulo] };
const history = { ...titulo, valor_base_carro: 90, transacoes: [{ id: 'tx-local', valor: 10, data_pagamento: '2026-11-11T12:00:00Z', tipo: 'ENTRADA', tipo_transacao: 'ACRESCIMO_TITULO' }], sub_titulos: [{ id: 'sub-local', descricao: 'Histórico adicional', valor_total: 10, data_vencimento: '2026-11-15', transacoes: [] }] };
const window = new Window({ url: 'http://localhost', settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
window.document.body.innerHTML = '<div id="root"></div>';
Object.defineProperty(window, 'crypto', { value: webcrypto });
window.fetch = () => { throw new Error('Network forbidden'); };
window.__calls = []; window.__alerts = []; window.alert = message => window.__alerts.push(message);
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
  import React from 'react'; import {createRoot} from 'react-dom/client';
  import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
  import LoteFinanceiro from './modules/lotes/components/details/LoteFinanceiro';
  const initial=${JSON.stringify(details)};
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  function App(){const [data,setData]=React.useState(initial); const [canCreate,setCanCreate]=React.useState(true); globalThis.__permission=setCanCreate;
    return <QueryClientProvider client={client}><LoteFinanceiro detalhes={data} canCreate={canCreate} onUpdated={()=>{globalThis.__refresh=(globalThis.__refresh||0)+1;setData({...data,titulos:data.titulos.map(t=>({...t,valor_pago:10,valor_acrescimo:10,valor_pendente:100}))});}}/></QueryClientProvider>;
  }
  createRoot(document.getElementById('root')).render(<App/>);
` }, bundle: true, write: false, format: 'iife', logLevel: 'silent', plugins: [{ name: 'strict-offline-services', setup(b) {
  b.onLoad({filter:/lotes\.financeiro\.service\.ts$/},()=>({loader:'ts',contents:`export const LoteFinanceiroService={getRecebimento:async()=>(${JSON.stringify(history)})};`}));
  b.onLoad({filter:/financeiro\/financeiro\.service\.ts$/},()=>({loader:'ts',contents:`import {TitulosService} from './services/titulos.service'; export const FinanceiroService={baixarTitulo:TitulosService.baixarTitulo,getContasBancarias:async()=>[]};`}));
  b.onLoad({filter:/contas-bancarias\/contas\.service\.ts$/},()=>({loader:'ts',contents:`export const ContasBancariasService={getAll:async()=>[{id:'conta-local',ativo:true,banco_nome:'Caixa',titular:'Teste',saldo_atual:0},{id:'conta-inativa',ativo:false}]};`}));
  b.onLoad({filter:/formas-pagamento\/formas-pagamento\.service\.ts$/},()=>({loader:'ts',contents:`export const FormasPagamentoService={getAll:async()=>[{id:'forma-local',nome:'PIX',ativo:true,destino_lancamento:'CAIXA',tipo_movimentacao:'RECEBIMENTO'},{id:'prazo-local',nome:'Prazo',ativo:true,destino_lancamento:'FINANCEIRO',tipo_movimentacao:'RECEBIMENTO'}]};`}));
  b.onLoad({filter:/contas-receber\/contas-receber\.service\.ts$/},()=>({loader:'ts',contents:`export const ContasReceberService={delete:()=>{throw new Error('Forbidden mutation in readOnly history')}};`}));
  b.onLoad({filter:/lib\/supabase\.ts$/},()=>({loader:'ts',contents:`export const supabase={from:()=>{throw new Error('Unexpected DB table access')},rpc:async(name,payload)=>{if(name!=='baixar_titulo_lote')throw new Error('Unexpected RPC '+name);globalThis.__calls.push({name,payload});if(globalThis.__delay)await new Promise(r=>setTimeout(r,globalThis.__delay));return {error:globalThis.__rpcError?{message:'Falha simulada'}:null};}};`}));
} }] });
if (process.argv.includes('--preview')) {
  mkdirSync('scratch/lotes-compactos', { recursive: true });
  writeFileSync('scratch/lotes-compactos/financeiro-real.js', 'globalThis.__calls=[];globalThis.__alerts=[];\n' + bundle.outputFiles[0].text);
}
try {
  window.eval(bundle.outputFiles[0].text);
  const doc=window.document;
  const flush=()=>new Promise(r=>setTimeout(r,45));
  const text=()=>doc.body.textContent;
  const btn=name=>{const b=[...doc.querySelectorAll('button')].find(b=>b.textContent.trim()===name||b.textContent.includes(name));assert.ok(b,name);return b};
  const click=async name=>{btn(name).click();await flush()};
  const set=async(el,value)=>{assert.ok(el);const proto=el.tagName==='SELECT'?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new window.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));await flush()};
  const input=label=>[...doc.querySelectorAll('label')].find(l=>l.textContent.includes(label))?.parentElement.querySelector('input,select');
  await flush(); await click('Cliente sintético'); await click('Registrar recebimento');
  assert.match(text(),/Acréscimo \(Juros\)/); await click('Cancelar'); assert.equal(window.__calls.length,0);
  await click('Histórico de recebimentos'); await flush(); assert.match(text(),/Histórico de Recebimentos/);
  assert.doesNotMatch(text(),/Adicionar Empréstimo|Confirmar Lançamento/);
  const visibleButtons=[...doc.querySelectorAll('button')].filter(b=>!b.closest('[hidden], .hidden'));
  assert.ok(!visibleButtons.some(b=>/Editar Recebimento|Estornar Recebimento|Editar Lançamento|Remover cobrança adicional/.test(b.title)));
  await click('Fechar Visualização'); await click('Registrar recebimento');
  await set(input('Conta Bancária'),'conta-local'); await set(input('Forma de Movimentação'),'forma-local');
  assert.ok(![...input('Forma de Movimentação').options].some(o=>o.value==='prazo-local'));
  await set(input('Acréscimo (Juros)'),'1000'); await set(input('Valor a ser Efetivamente'),'1000');
  assert.equal(input('Acréscimo (Juros)').value,'10,00'); assert.equal(input('Valor a ser Efetivamente').value,'10,00');
  window.__rpcError=true; await click('Confirmar');
  assert.equal(window.__calls.length,1,'interest-only should reach the lote RPC once');
  assert.match(window.__alerts.at(-1),/Falha simulada/); assert.ok(doc.querySelector('form'),'failure keeps the modal');
  const first=window.__calls[0]; assert.equal(first.payload.p_valor,10); assert.equal(first.payload.p_acrescimo,10); assert.equal(first.payload.p_desconto,0);
  assert.equal(first.payload.p_conta_id,'conta-local'); assert.equal(first.payload.p_forma_pagamento_id,'forma-local');
  window.__rpcError=false; window.__delay=130; btn('Confirmar').click(); await flush(); assert.equal(btn('Processando...').disabled,true); btn('Processando...').click();
  await new Promise(r=>setTimeout(r,170)); await flush(); assert.equal(window.__calls.length,2,'disabled repeat click must not submit again');
  assert.equal(window.__calls[1].payload.p_request_id,first.payload.p_request_id,'retry preserves idempotency key');
  assert.equal(window.__refresh,1); assert.equal(doc.querySelector('form'),null); assert.match(text(),/100,00/,'interest-only leaves principal outstanding');
  window.__permission(false); await flush(); assert.equal(btn('Registrar recebimento').disabled,true);
  console.log('PASS: real ModalBaixa and QuickView, interest-only payload, cancel, failure persistence, same-key retry, single in-flight submit, readOnly history and permission gate.');
} finally { window.happyDOM.abort(); }
