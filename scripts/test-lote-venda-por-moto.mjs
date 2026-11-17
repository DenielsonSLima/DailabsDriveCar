import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Window} from 'happy-dom';
const w = new Window({url:'http://localhost'}); w.document.body.innerHTML='<div id="root"></div>';w.fetch=()=>{throw Error('Network forbidden')};
const result=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {LoteVendaForm} from './modules/lotes/components/LoteForms';const catalogos={parceiros:[{id:'cliente',nome:'Cliente',tipo:'CLIENTE'}],categorias:[],contas:[{id:'conta',titular:'Teste',banco_nome:'Banco'}],formas:[{id:'forma',nome:'Dinheiro',tipo_movimentacao:'RECEBIMENTO',destino_lancamento:'CONTA_BANCARIA'}]};globalThis.calls=[];createRoot(document.getElementById('root')).render(<LoteVendaForm catalogos={catalogos} disponiveis={5} onClose={()=>{}} onCreateCliente={async()=>({})} onSave={async(payload,id)=>{globalThis.calls.push({payload,id});throw Error('Simulated retry');}}/>);`},bundle:true,write:false,format:'iife',logLevel:'silent',plugins:[{name:'no-network',setup(b){b.onLoad({filter:/lib\/supabase\.ts$/},()=>{throw Error('Supabase forbidden')})}}]});
w.eval(result.outputFiles[0].text);const flush=()=>new Promise(r=>setTimeout(r,100));await flush();const d=w.document;
async function field(label,value){const lab=[...d.querySelectorAll('label')].find(x=>x.textContent.includes(label));const input=lab?.querySelector('input,select')||d.querySelector(`[aria-label="${label}"]`);assert.ok(input,label);const proto=input.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);input.dispatchEvent(new w.Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));await flush();}
try{
 await field('Cliente','cliente');await field('Quantidade','2');await field('Preço por unidade','100.01');await field('Entrada recebida agora por moto','10.01');
 const selects=[...d.querySelectorAll('select')];for(const select of selects){if(select===d.querySelector('[aria-label="Cliente"]'))continue;const option=[...select.options].find(o=>o.value);if(option){Object.getOwnPropertyDescriptor(w.HTMLSelectElement.prototype,'value').set.call(select,option.value);select.dispatchEvent(new w.Event('change',{bubbles:true}));await flush();}}
 await field('Parcelas por moto','3');
 assert.match(d.body.textContent,/Mesmas condições para cada uma das 2/);assert.match(d.body.textContent,/200,02/);
 const submit=async()=>{d.querySelector('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await flush()};await submit();assert.equal(w.calls.length,1);const p=w.calls[0].payload;assert.equal(p.modo_financeiro,'POR_UNIDADE');assert.equal(p.valor_total,200.02);assert.equal(p.pagamentos.length,8);
 for(let i=0;i<2;i++){const rows=p.pagamentos.filter(x=>x.unidade_indice===i);assert.equal(rows.length,4);assert.equal(rows.reduce((s,r)=>s+Math.round(r.valor*100),0),10001);assert.equal(rows[0].valor,10.01);assert.equal(rows[1].valor,30);}
 await submit();assert.equal(w.calls[0].id,w.calls[1].id,'retry keeps idempotency key');
 await field('Entrada recebida agora por moto','101');await submit();assert.equal(w.calls.length,2);assert.match(d.body.textContent,/não pode superar/);
 console.log('PASS per-moto form: visible units and totals, entry, 3 installments each, exact cents, retry UUID, excessive entry blocked; no external calls');
}finally{w.happyDOM.abort()}
