// Offline screenshots and geometry. All records are synthetic, services never loaded.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { commercialFixtureData as fixture } from './visual-workflows-commercial-fixtures.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/tmp/dailabs-browser-legacy/node_modules/playwright-core/index.mjs');
const root=process.cwd(), out=join(root,'scratch/lotes-compactos'); mkdirSync(out,{recursive:true});
await build({stdin:{resolveDir:root,loader:'tsx',contents:`
import React from 'react'; import {createRoot} from 'react-dom/client';
import Stock from './modules/estoque/components/EstoqueDashboard';
import Purchases from './modules/pedidos-compra/components/PedidosList';
import Sales from './modules/pedidos-venda/components/PedidosVendaList';
const f=${JSON.stringify(fixture)};
const key = new URLSearchParams(location.search).get('scene') || 'estoque';
const rows=(item)=>Array.from({length:4},(_,index)=>({...item,id:item.id+index}));
const stats={totalInvestido:1527935.46,totalCustoBase:1512040,totalServicos:15895.46,count:40,socioStats:[1,2,3].map(i=>({nome:'Sócio demonstrativo '+i,totalValor:1527935.46/3,count:40,percent:100/3}))};
createRoot(document.getElementById('root')).render(<div data-drivecar-ui className="p-4 sm:p-6"><h1 className="mb-5 text-2xl font-semibold">{key==='estoque'?'Estoque de veículos':key==='compras'?'Entrada de veículos':'Saída de veículos'}</h1>{key==='estoque'?<Stock stats={stats} socios={[]}/>:key==='compras'?<Purchases pedidos={rows(f.purchase)} loading={false} onEdit={()=>{}}/>:<Sales pedidos={rows(f.sale)} loading={false} onEdit={()=>{}}/>}</div>);`},bundle:true,format:'esm',platform:'browser',outfile:join(out,'cards.js'),define:{'process.env.NODE_ENV':'"development"'},logLevel:'silent'});
writeFileSync(join(out,'input.css'),'@tailwind base;@tailwind components;@tailwind utilities;');
execFileSync('/tmp/dailabs-qa-tools/node_modules/.bin/tailwindcss',['-i',join(out,'input.css'),'-o',join(out,'tailwind.css'),'--content',`${root}/modules/**/*.tsx,${root}/components/**/*.tsx`],{stdio:'pipe'});
const inline=readFileSync('index.html','utf8').match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';
const html=(lote)=>`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/tailwind.css"><link rel="stylesheet" href="/index.css"><style>${inline}</style></head><body><p style="padding:8px 24px;background:#fef3c7;font-size:12px">PRÉVIA LOCAL · DADOS FICTÍCIOS</p><div style="display:flex"><aside style="width:240px;background:#101828;color:#fff;padding:28px;flex-shrink:0" class="hidden md:block"><b>Dailabs DriveCar</b><p style="margin-top:24px;font-size:14px">Estoque · Lotes</p></aside><main style="min-width:0;flex:1"><div data-drivecar-ui ${lote?'style="padding:20px"':''} id="${lote?'lote-preview':'root'}"></div></main></div><script type="module" src="/${lote?'lote-preview.js':'cards.js'}"></script></body></html>`;
const server=createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;try{if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end(html(false));return;}if(pathname==='/financeiro-real'){res.setHeader('Content-Type','text/html');res.end(html(false).replace('/cards.js','/financeiro-real.js'));return;}if(pathname==='/lote'){res.setHeader('Content-Type','text/html');res.end(html(true));return;}const file=pathname==='/index.css'?join(root,'index.css'):pathname==='/lote-preview.js'?join(root,'scratch/lote-preview.js'):join(out,pathname);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':'text/css');res.end(readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/dailabs-browsers/chromium_headless_shell-1161/chrome-linux/headless_shell',args:['--no-sandbox'],headless:true});
const report={errors:[],screens:[],blocked:[]};
try {for(const width of [1440,1024,390]) {
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():(report.blocked.push(r.request().url()),r.abort()));
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 async function capture(name){await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name+' document overflow');assert.doesNotMatch(await page.locator('body').innerText(),/NaN|Invalid Date/);const path=join(out,name+'-'+width+'.png');await page.screenshot({path,fullPage:true});report.screens.push(path);}
 for(const scene of ['estoque','compras','vendas']){await page.goto(origin+'/?scene='+scene);await page.waitForTimeout(200);await capture(scene);
 if(width===1440){const grid=page.locator(scene==='estoque'?'dl':'#root .grid').first();assert.equal(await grid.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),4,scene+' requires four columns');}
 if(scene==='estoque'&&width===1440)assert.ok((await page.locator('section').boundingBox()).height<240,'Stock KPI area compact');
 }
 await page.goto(origin+'/lote?populated=1');await page.waitForTimeout(200);await capture('resumo');
 for(const tab of ['Entrada','Despesas','Saídas','Financeiro']){await page.getByRole('button',{name:tab,exact:true}).first().click();await page.waitForTimeout(100);await capture(tab.toLowerCase());}
 await page.getByRole('button',{name:/Cliente de teste.*Em aberto/}).first().click();await page.getByRole('button',{name:'Voltar ao financeiro'}).waitFor();await capture('financeiro-detalhes');await page.getByRole('button',{name:'Voltar ao financeiro'}).click();assert.equal(await page.getByRole('button',{name:'Voltar ao financeiro'}).count(),0);
 await page.getByRole('button',{name:'Resumo',exact:true}).click();await page.getByRole('button',{name:/^Despesas.*Custos registrados/}).click();await page.getByRole('button',{name:'Adicionar despesa',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await page.goto(origin+'/financeiro-real');await page.waitForTimeout(200);
 await page.getByRole('button',{name:/Cliente sintético.*Em aberto/}).click();
 await page.getByRole('button',{name:'Registrar recebimento / juros'}).click();
 await page.getByText('Confirmar Liquidação',{exact:true}).waitFor();await capture('financeiro-baixa-real');
 const overlay=page.locator('div.fixed[data-drivecar-ui]').last();const box=await overlay.boundingBox();assert.ok(box&&Math.abs(box.x)<1&&Math.abs(box.y)<1,'Finance modal must cover viewport');
 await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(await page.getByText('Confirmar Liquidação',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Histórico de recebimentos',exact:true}).click();await page.getByText('Histórico de Recebimentos',{exact:true}).last().waitFor();await capture('financeiro-historico-real');
 await page.getByRole('button',{name:'Fechar Visualização'}).click();
 await context.close();
 }}finally{await browser.close();server.close();writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));}
assert.deepEqual(report.errors,[]);console.log(JSON.stringify({screens:report.screens.length,errors:report.errors,blocked:report.blocked},null,2));
