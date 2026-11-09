// Run after node scripts/test-lotes-ui.mjs --preview. Requires happy-dom,
// or HAPPY_DOM_MODULE pointing to its ESM entry in a separate test installation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { Window } = await import(process.env.HAPPY_DOM_MODULE || 'happy-dom');
const window = new Window({url:'http://localhost/scratch/lote-preview.html', settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
window.structuredClone=structuredClone;
window.fetch=()=>{throw new Error('Network forbidden in local test')};
window.document.body.innerHTML='<div id="lote-preview"></div>';
window.eval((await readFile(new URL('../scratch/lote-preview.js',import.meta.url),'utf8')).replace(/import\.meta\.hot/g,'false'));
const doc=window.document;
const flush=()=>new Promise(resolve=>setTimeout(resolve,40));
const text=()=>doc.body.textContent;
const button=name=>{const found=[...doc.querySelectorAll('button')].find(e=>e.textContent.trim()===name||e.getAttribute('aria-label')===name);assert.ok(found,'button '+name);return found};
const click=async name=>{button(name).click();await flush()};
const input=async (selector,value)=>{const el=doc.querySelector(selector);assert.ok(el,selector);Object.getOwnPropertyDescriptor(el instanceof window.HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:el instanceof window.HTMLSelectElement?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new window.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));await flush();};
const field=label=>[...doc.querySelectorAll('label')].find(el=>el.querySelector('span')?.textContent===label)?.querySelector('input,select,textarea');
const setField=async(label,value)=>{const el=field(label);assert.ok(el,label);el.dataset.testInput='target';await input('[data-test-input=target]',value);delete el.dataset.testInput};
const submit=async()=>{doc.querySelector('[role=dialog] form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await flush()};
const search='input[type=search]'; const select='select[aria-label=Cliente]';
try{
 await flush();await click('Saídas');await click('Registrar venda');
 assert.equal(doc.querySelectorAll('[role=dialog]').length,1);
 await submit();assert.match(doc.querySelector('[role=alert]').textContent,/Selecione o cliente/);
 await input(search,'cliente');assert.equal(doc.querySelector(select).options.length,2);
 await input(select,'cliente');await input(search,'nao existe');assert.match(text(),/Nenhum cliente encontrado/);assert.equal(doc.querySelector(select).value,'cliente');
 await input(search,'');await setField('Quantidade','2');await setField('Preço por unidade (R$)','9900');await setField('Observações (opcional)','Preservar');
 const date=field('Data da venda').value;
 await click('Cadastrar novo cliente');assert.equal(doc.querySelectorAll('[role=dialog]').length,1);
 await input('input[name=nome]','Cancelado');doc.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await flush();
 assert.match(text(),/Registrar venda do lote/);assert.equal(field('Quantidade').value,'2');assert.equal(field('Preço por unidade (R$)').value,'9900');
 await click('Cadastrar novo cliente');await click('Voltar à venda');await click('Cadastrar novo cliente');
 await input('input[name=nome]','José Ávila');await input('input[name=documento]','12345678901');await submit();assert.match(doc.querySelector('[role=alert]').textContent,/CEP é obrigatório/);
 for(const [name,value] of Object.entries({cep:'49000000',logradouro:'Rua Teste',numero:'10',bairro:'Centro',cidade:'Aracaju',uf:'SE'}))await input('input[name='+name+']',value);
 window.__lotesClienteTest={calls:[],error:'Falha simulada',delay:0};await submit();assert.match(doc.querySelector('[role=alert]').textContent,/Falha simulada/);
 assert.equal(doc.querySelector('input[name=nome]').value,'JOSÉ ÁVILA');
 window.__lotesClienteTest.error=null;window.__lotesClienteTest.delay=150;await submit();assert.equal(button('Salvando…').disabled,true);
 doc.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await submit();assert.match(text(),/Novo cliente para a venda/);
 await new Promise(resolve=>setTimeout(resolve,200));await flush();
 const calls=window.__lotesClienteTest.calls;assert.equal(calls.length,2);assert.equal(calls[0].id,calls[1].id);assert.equal(doc.querySelector(select).value,calls[1].id);
 assert.equal(field('Quantidade').value,'2');assert.equal(field('Preço por unidade (R$)').value,'9900');assert.equal(field('Observações (opcional)').value,'Preservar');assert.equal(field('Data da venda').value,date);
 await input(search,'jose avila');assert.equal(doc.querySelector(select).options.length,2);await input(search,'123.456');assert.equal(doc.querySelector(select).options.length,2);
 const enter=new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});doc.querySelector(search).dispatchEvent(enter);assert.equal(enter.defaultPrevented,true);
 await setField('Forma de recebimento prevista','prazo');await submit();assert.equal(doc.querySelectorAll('[role=dialog]').length,0);assert.match(text(),/JOSÉ ÁVILA/);assert.match(text(),/19.800,00/);
 await click('Registrar venda');await input(search,'jose');assert.equal(doc.querySelector(select).options.length,2);await click('Fechar janela');assert.equal(doc.body.style.overflow,'');
 assert.equal(window.location.pathname,'/scratch/lote-preview.html');
 console.log('OK: offline DOM interactions: search/accent/document, one modal, cancel/Escape, preserved fields, validation, errors and stable retry UUID, busy/repeated submit guard, auto-selection/cache, completed mocked sale. No production calls.');
}finally{await window.happyDOM.abort();window.close()}
