// Browser regression on the real route components and purchase/lot RPC adapters.
// No data or traffic reaches Supabase. Install playwright-core and tailwindcss@3
// into a temporary tools folder; supply QA_TOOL_DIR and optionally CHROMIUM_PATH.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { commercialFixtureData as f, getCommercialMockSource } from './visual-workflows-commercial-fixtures.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const toolDir = process.env.QA_TOOL_DIR || '/tmp/drivecar-browser-qa/node_modules';
const { chromium } = await import(pathToFileURL(join(toolDir, 'playwright-core/index.mjs')).href);
const out = resolve(process.env.QA_OUTPUT_DIR || join(root, 'scratch/entrada-lote-qa'));
mkdirSync(out, { recursive: true });
const orgId = 'qa-organization';
const oldLot = {
  id: 'old-lot', organization_id: orgId, pedido_id: 'old-purchase',
  descricao: 'Motos elétricas • Lote anterior', quantidade_inicial: 40, created_at: '2026-11-10T12:00:00Z',
  custo_aquisicao: 200000, encerrado: false, quantidade_disponivel: 15, quantidade_vendida: 25
};
const newDescription = 'Motos elétricas • Nova entrada';
const purchaseDraft = {
  ...f.purchaseDraft,
  id: 'batch-purchase',
  numero_pedido: 'DEMO-002',
  valor_negociado: 60000,
  descricao_veiculo: 'Motos elétricas',
  fornecedor: { ...f.supplier, nome: 'Fornecedor demonstrativo' },
  pagamentos: f.purchaseDraft.pagamentos.map(p => ({ ...p, pedido_id: 'batch-purchase', valor: 60000, conta_bancaria_id: null, conta_bancaria: null })),
  veiculos: [{
    ...f.vehicle, id: 'representative-unit', pedido_id: 'batch-purchase', status: 'RASCUNHO',
    placa: '', chassi: '', km: 0, montadora: {nome:'Moto Elétrica',logo_url:''}, modelo: {nome:'Urbana'},
    tipo_veiculo: {nome:'Motocicleta'}, versao: {nome:'Standard'}, ano_modelo:2026,
    valor_custo: 60000, valor_custo_servicos: 0, valor_venda: 0, despesas: [], socios: [], opcionais_ids: []
  }]
};

const mockSupabase = `
const draft=${JSON.stringify(purchaseDraft)};
const oldLot=${JSON.stringify(oldLot)};
const lotRows=[oldLot];
const getDraft=id=>{
  const order=structuredClone(draft);
  order.id=id;
  order.veiculos=order.veiculos.map(v=>({...v,pedido_id:id}));
  if(id==='consignado') { order.forma_pagamento.nome='Consignação'; order.veiculos[0].is_consignado=true; }
  if(id==='multiple') order.veiculos.push({...order.veiculos[0],id:'second-unit',valor_custo:0});
  return order;
};
const calls=globalThis.qaRpcCalls=[];
export const supabase={
  from(table) {
    if (table!=='cmp_pedidos') throw new Error('Unexpected Supabase query: '+table);
    let id;
    return { select(){return this;}, eq(field,value){ if(field==='id')id=value;return this; }, async single(){return { data:getDraft(id),error:null };} };
  },
  async rpc(name,args) {
    calls.push({name,args});
    if(name==='confirmar_pedido_compra_em_lote'){
      if(globalThis.qaRejectNextLot){globalThis.qaRejectNextLot=false;return {data:null,error:{message:'Falha simulada; nenhuma compra confirmada.'}};}
      const next = {
        ...oldLot,id:'new-lot',pedido_id:args.p_pedido_id, descricao:args.p_descricao,
        quantidade_inicial:args.p_quantidade, quantidade_disponivel:args.p_quantidade, quantidade_vendida:0,
        custo_aquisicao:60000,created_at:'2026-11-24T12:00:00Z'
      };
      lotRows.unshift(next);
      return {data:next.id,error:null};
    }
    if(name==='confirmar_pedido_compra')return {data:[],error:null};
    if(name==='listar_lotes'){
      const rows=lotRows.filter(r=> (!args.p_pedido_id || r.pedido_id===args.p_pedido_id) &&
        (!args.p_search || r.descricao.toLowerCase().includes(args.p_search.toLowerCase())));
      return {data:structuredClone(rows),error:null};
    }
    throw Error('Unexpected Supabase RPC: '+name);
  }
};`;
const appSource = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {useAuthStore} from './store/auth.store';
import Layout from './components/Layout';
import Purchases from './modules/pedidos-compra/PedidoCompraDetalhes.page';
import PurchaseForm from './modules/pedidos-compra/PedidoCompraForm.page';
import Stock from './modules/estoque/Estoque.page';
useAuthStore.setState({profile:{nome:'Usuário demonstrativo',role:'ADMIN'},loading:false});
const wrap=child=><Layout>{child}</Layout>;
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><BrowserRouter><Routes>
<Route path="/pedidos-compra/novo" element={wrap(<PurchaseForm/>)}/>
<Route path="/pedidos-compra/:id" element={wrap(<Purchases/>)}/>
<Route path="/estoque" element={wrap(<Stock/>)}/>
</Routes></BrowserRouter></QueryClientProvider>);`;

await build({
  absWorkingDir: root, stdin:{resolveDir:root,loader:'tsx',contents:appSource}, bundle:true,
  format:'esm', platform:'browser', outfile:join(out,'bundle.js'),
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'}, logLevel:'silent',
  plugins:[{name:'synthetic-only',setup(b){
    b.onLoad({filter:/[\\/]lib[\\/]supabase\.ts$/},()=>({loader:'ts',contents:mockSupabase}));
    b.onLoad({filter:/pedidos-compra\.realtime\.ts$/},()=>({loader:'ts',contents:'export const PedidosCompraRealtime={subscribe:()=>({unsubscribe(){}})};'}));
    b.onLoad({filter:/\.service\.ts$/},args=>{
      const file=args.path.replaceAll('\\','/').split('/').at(-1);
      if (['pedidos-compra.service.ts','lotes.service.ts'].includes(file)) return;
      const mock = {
        'empresa.service.ts': `export const EmpresaService={getCurrentOrganizationId:async()=>${JSON.stringify(orgId)},getDadosEmpresa:async()=>null};`,
        'marca-dagua.service.ts': `export const MarcaDaguaService={getConfig:async()=>null};`,
        'financeiro.service.ts': `export const FinanceiroService={previewCronograma:async()=>[{numero:1,data_vencimento:'2026-12-01',valor:60000}]};`
      }[file] || getCommercialMockSource(args.path);
      if (mock) return {loader:'ts',contents:mock};
      const exports=[...readFileSync(args.path,'utf8').matchAll(/export\s+(?:const|class|function|async\s+function)\s+(\w+)/g)].map(m=>m[1]);
      return {loader:'ts',contents:`const mock=new Proxy({}, {get:()=>async()=>[]});${exports.map(n=>`export const ${n}=mock;`).join('')}`};
    });
  }}]
});
const htmlStyle=readFileSync(join(root,'index.html'),'utf8').match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';
writeFileSync(join(out,'inline.css'),htmlStyle);
writeFileSync(join(out,'tailwind-input.css'),'@tailwind base;@tailwind components;@tailwind utilities;');
execFileSync(join(toolDir,'.bin/tailwindcss'),[
  '-i',join(out,'tailwind-input.css'),'-o',join(out,'tailwind.css'),'--content',`${root}/modules/**/*.tsx,${root}/components/**/*.tsx`
],{stdio:'pipe'});
const preview='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; connect-src \'none\'"><link rel="stylesheet" href="/tailwind.css"><link rel="stylesheet" href="/inline.css"><link rel="stylesheet" href="/index.css"></head><body><div style="position:fixed;z-index:500;bottom:12px;right:12px;border-radius:6px;padding:5px 9px;background:#fef3c7;color:#92400e;font:600 11px system-ui;pointer-events:none">DEMONSTRAÇÃO · DADOS FICTÍCIOS</div><div id="root"></div><script type="module" src="/bundle.js"></script></body></html>';
const server = createServer((req,res)=>{
  const path = new URL(req.url,'http://localhost').pathname;
  try {
    const allowed = ['/bundle.js','/tailwind.css','/inline.css'];
    if(path==='/index.css'||allowed.includes(path)||/^\/(brand|logos)\/[\w.\-/]+$/.test(path)){
      const file=path==='/index.css'?join(root,'index.css'):allowed.includes(path)?join(out,path):join(root,'public',path);
      res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'image/png');
      return res.end(readFileSync(file));
    }
    if(path==='/favicon.ico'){res.statusCode=204;return res.end();}
    res.setHeader('Content-Type','text/html');res.end(preview);
  } catch { res.statusCode=404;res.end(); }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const report={passes:[],screenshots:[],errors:[],externalRequests:[]};
const pass=name=>report.passes.push(name);
const getConfirm=page=>page.getByRole('button',{name:'Confirmar Entrada',exact:true});
const getModal=page=>page.locator('.dc-modal').filter({has:page.getByRole('heading',{name:'Finalizar Compra'})});
const getMode=(modal,name)=>modal.getByRole('radio',{name,exact:true});
const getQty=modal=>modal.getByRole('spinbutton',{name:/Quantidade de unidades/i});
const listCall=page=>page.evaluate(()=>globalThis.qaRpcCalls.filter(c=>c.name.startsWith('confirmar_')));
async function navigate(page,path){await page.goto(origin+path);}
async function makePage(width,height){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.route('**/*',r=>{
    if(r.request().url().startsWith(origin+'/'))return r.continue();
    report.externalRequests.push(r.request().url());
    return r.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  return page;
}
async function capture(page,name,locator){
  await page.evaluate(()=>document.fonts.ready);
  const path=join(out,name+'.png');
  await (locator??page).screenshot({path,animations:'disabled'});
  report.screenshots.push(path);
}
async function openConfirm(page,path='/pedidos-compra/batch-purchase') {
  await navigate(page,path);
  await getConfirm(page).click();
  const modal=getModal(page);await modal.waitFor();
  return modal;
}
async function fillLot(modal,qty) {
  await getMode(modal,'Lote').check();
  const quantity=getQty(modal);
  await quantity.fill(String(qty));
  await modal.getByRole('textbox',{name:/Descrição do lote/i}).fill(newDescription);
  return quantity;
}
try {
  const page=await makePage(1380,900);
  await navigate(page,'/estoque?aba=lotes');
  const shortcut=page.getByRole('link',{name:/Nova entrada em lote/i});
  await shortcut.waitFor();
  assert.equal(await shortcut.getAttribute('href'),'/pedidos-compra/novo?tipo=lote');
  const original=page.getByRole('link',{name:/Lote anterior/});
  await original.waitFor();
  assert.equal(await page.getByRole('region',{name:'Lotes em estoque'}).getByRole('link').count(),1);
  pass('Estoque → Lotes oferece atalho para nova entrada, com um lote anterior independente');
  await shortcut.click();
  await page.waitForURL('**/pedidos-compra/novo?tipo=lote');
  await page.getByText(/Salve o pedido e cadastre uma ficha para representar o lote/).waitFor();
  await capture(page,'00-iniciar-nova-entrada-em-lote');
  pass('Atalho abre o cadastro de entrada com instrução sobre a ficha representativa do lote');

  let modal=await openConfirm(page);
  assert.equal(await getMode(modal,'Individual').isChecked(),true);
  assert.equal(await getQty(modal).count(),0);
  const qty=await fillLot(modal,1);
  const submit=modal.getByRole('button',{name:/Confirmar entrada em lote/i});
  for(const invalid of ['1','0','1001','2.5','']){
    await qty.fill(invalid);
    assert.equal(await submit.isDisabled(),true,'invalid qty '+invalid);
  }
  assert.deepEqual(await listCall(page),[]);
  pass('Lote exibe campos e impede quantidade vazia, decimal ou fora de 2–1.000');
  await qty.fill('12');
  assert.equal(await submit.isEnabled(),true);
  await capture(page,'01-confirmar-lote-12-unidades');
  await page.evaluate(()=>{globalThis.qaRejectNextLot=true;});
  await submit.click();
  await page.getByText(/Falha simulada; nenhuma compra confirmada/).first().waitFor();
  assert.equal(await modal.isVisible(),true);
  assert.equal(await qty.inputValue(),'12');
  assert.deepEqual((await listCall(page)).map(c=>c.name),['confirmar_pedido_compra_em_lote']);
  pass('Falha mantém modal e quantidade preenchida, sem chamada separada para confirmar compra');

  await submit.click();
  await page.waitForURL('**/estoque?aba=lotes');
  const cards=page.getByRole('region',{name:'Lotes em estoque'});
  const newCard=cards.getByRole('link',{name:/Nova entrada/});
  const oldCard=cards.getByRole('link',{name:/Lote anterior/});
  await newCard.waitFor(); await oldCard.waitFor();
  assert.equal(await cards.getByRole('link').count(),2);
  assert.equal(await newCard.getAttribute('href'),'/lotes/new-lot');
  assert.equal(await oldCard.getAttribute('href'),'/lotes/old-lot');
  assert.match(await newCard.innerText(),/12 unidades adquiridas/);
  assert.match(await oldCard.innerText(),/40 unidades adquiridas/);
  assert.match(await oldCard.innerText(),/Vendidas\s+25/);
  assert.deepEqual((await listCall(page)).map(c=>c.args),Array(2).fill({p_pedido_id:'batch-purchase',p_quantidade:12,p_descricao:newDescription}));
  await capture(page,'02-estoque-dois-lotes');
  pass('Ao confirmar, RPC recebe pedido/quantidade/descrição e o estoque mostra 12 e 40 unidades em cards distintos');

  modal=await openConfirm(page,'/pedidos-compra/individual');
  await modal.getByRole('button',{name:'Gerar Títulos e Confirmar Pedido'}).click();
  await modal.waitFor({state:'detached'});
  assert.deepEqual(await listCall(page),[{name:'confirmar_pedido_compra',args:{p_pedido_id:'individual'}}]);
  pass('Compra individual mantém o RPC e comportamento normal');

  await navigate(page,'/pedidos-compra/consignado');
  await getConfirm(page).click();
  await page.waitForFunction(()=>globalThis.qaRpcCalls.some(c=>c.name==='confirmar_pedido_compra'));
  assert.equal(await getModal(page).count(),0);
  assert.deepEqual(await listCall(page),[{name:'confirmar_pedido_compra',args:{p_pedido_id:'consignado'}}]);
  pass('Consignação mantém confirmação individual sem oferecer lote');

  modal=await openConfirm(page,'/pedidos-compra/multiple');
  const multipleMode=getMode(modal,'Lote');
  if(await multipleMode.count()) assert.equal(await multipleMode.isDisabled(),true);
  assert.equal(await getQty(modal).count(),0);
  pass('Compra com vários representantes não oferece lote');

  const mobile=await makePage(390,844);
  modal=await openConfirm(mobile,'/pedidos-compra/batch-purchase?tipo=lote');
  assert.equal(await getMode(modal,'Lote').isChecked(),true);
  await fillLot(modal,12);
  const mobileConfirm=modal.getByRole('button',{name:/Confirmar entrada em lote/i});
  await mobileConfirm.scrollIntoViewIfNeeded();
  const box=await mobileConfirm.boundingBox();
  assert.ok(box&&box.y>=0&&box.y+box.height<=844);
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await capture(mobile,'03-confirmar-lote-celular');
  pass('Pré-seleção de Lote e botão de confirmação acessível no celular');
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.externalRequests,[]);
} finally {
  await browser.close();server.close();
  writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
