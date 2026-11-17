/**
 * Isolated PostgreSQL/WASM regression suite. It never connects to a remote service.
 * Optional pinned dependency (no project package/lockfile changes):
 * npm install --prefix /tmp/drivecar-lotes-pglite @electric-sql/pglite@0.5.11 --no-audit --no-fund
 * PGLITE_MODULE_PATH=/tmp/drivecar-lotes-pglite/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-lotes-sql.mjs
 * Node.js 20+; every fixture record is synthetic and discarded with this database.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

process.on('uncaughtException', error => {
  console.error('SQL test failed:', error.message, error.detail || '', error.where || '');
  process.exit(1);
});
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(readFileSync(new URL('./fixtures/lotes-schema.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261024163146_lotes_veiculos_custos_vendas.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261024163638_index_lotes_foreign_keys.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261109181558_ajustar_quantidade_lote.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261111181906_juros_baixa_lote.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261117145256_lote_financeiro_por_unidade.sql', import.meta.url), 'utf8'));
console.log('PASS migrations applied to isolated fixture');
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const columns = await q(`SELECT table_name,column_name,data_type,is_nullable,column_default,is_generated
  FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`);
const tables = {};
for (const column of columns) (tables[column.table_name] ||= []).push(column);
await db.exec("SET TimeZone = 'America/Maceio'");
const today = (await q('SELECT CURRENT_DATE::text d'))[0].d;
const ids={org:'11111111-1111-4111-8111-111111111111',other:'22222222-2222-4222-8222-222222222222',user:'33333333-3333-4333-8333-333333333333',vehicle:'44444444-4444-4444-8444-444444444444',pedido:'55555555-5555-4555-8555-555555555555',cliente:'66666666-6666-4666-8666-666666666666',categoria:'77777777-7777-4777-8777-777777777777',forma:'88888888-8888-4888-8888-888888888888',conta:'99999999-9999-4999-8999-999999999999',titulo:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'};
// Required fields from the actual catalog; their values do not contain production data.
async function seed(table,values){const vals={}; for(const c of tables[table]) {if(c.is_nullable==='NO'&&!c.column_default&&c.is_generated!=='ALWAYS'&&!(c.column_name in values)) vals[c.column_name]=c.data_type==='uuid'?randomUUID():['integer','numeric','bigint','smallint'].includes(c.data_type)?1:c.data_type==='boolean'?true:c.data_type.includes('timestamp')?new Date().toISOString():c.data_type==='date'?today:c.data_type==='jsonb'?'{}':'fixture';} Object.assign(vals,values); const keys=Object.keys(vals);await q(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(vals));}
await seed('organizations',{id:ids.org}); await seed('organizations',{id:ids.other});
await seed('organization_members',{organization_id:ids.org,user_id:ids.user});
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[ids.user]);
await seed('parceiros',{id:ids.cliente,organization_id:ids.org,nome:'Cliente Teste'});
await seed('fin_categorias',{id:ids.categoria,organization_id:ids.org,nome:'Frete',tipo:'VARIAVEL',natureza:'SAIDA'});
await seed('cad_formas_pagamento',{id:ids.forma,organization_id:ids.org,nome:'PIX',tipo_movimentacao:'AMBOS',destino_lancamento:'CAIXA',ativo:true});
await seed('fin_contas_bancarias',{id:ids.conta,organization_id:ids.org,banco_nome:'Teste',titular:'Teste',saldo_atual:1000000,ativo:true});
await seed('cmp_pedidos',{id:ids.pedido,organization_id:ids.org,numero_pedido:100,status:'CONCLUIDO',valor_negociado:304000});
const parceirosInvestidores=[randomUUID(),randomUUID(),randomUUID()];
for(const id of parceirosInvestidores)await seed('config_socios',{id,organization_id:ids.org,nome:'Socio '+id.slice(0,4),ativo:true,participacao:33.33});
const socios=parceirosInvestidores.map((id,i)=>({socio_id:id,nome:'Socio '+i,porcentagem:i===0?33.34:33.33,valor:0}));
await seed('est_veiculos',{id:ids.vehicle,organization_id:ids.org,pedido_id:ids.pedido,status:'DISPONIVEL',valor_custo:304000,valor_custo_servicos:0,is_consignado:false,valor_venda:500000,valor_promocional:490000,socios:JSON.stringify(socios)});
await seed('fin_titulos',{id:ids.titulo,organization_id:ids.org,pedido_id:ids.pedido,veiculo_id:ids.vehicle,origem_tipo:'PEDIDO_COMPRA',origem_id:ids.pedido,tipo:'PAGAR',descricao:'Compra Original',valor_total:304000,data_vencimento:today});
await db.exec('SET ROLE authenticated');
const lote=(await q('SELECT public.criar_lote($1,50,$2) id',[ids.vehicle,'Lote motos']))[0].id;
console.log('PASS conversion and acquisition source');
const count=(await q('SELECT count(*)::int n,sum(valor_custo)::numeric custo,count(*) filter(where publicado_site) pub FROM est_veiculos WHERE lote_id=$1',[lote]))[0];
const investorCheck=(await q(`SELECT sum((x->>'valor')::numeric) total FROM est_veiculos v CROSS JOIN LATERAL jsonb_array_elements(v.socios) x WHERE lote_id=$1`,[lote]))[0].total; if(+investorCheck!==304000)throw Error('investor allocation mismatch '+investorCheck);
if(count.n!==50 || +count.custo!==304000 || +count.pub!==0) throw Error('allocation invalid '+JSON.stringify(count));
if((await q('SELECT public.criar_lote($1,50,$2) id',[ids.vehicle,'Lote motos']))[0].id!==lote)throw Error('conversion duplicate');
async function mustFail(label,sql,params=[]){try{await q(sql,params);}catch(e){console.log('blocked',label,':',e.message);return;}throw Error('expected block: '+label);}
await mustFail('direct edit',"UPDATE est_veiculos SET valor_custo=1 WHERE id=$1",[ids.vehicle]);
await mustFail('legacy sale',"INSERT INTO venda_pedidos(organization_id,veiculo_id,status) VALUES($1,$2,'CONCLUIDO')",[ids.org,ids.vehicle]);
const assert = (x, msg) => {if(!x)throw Error(msg)};
const future=(await q('SELECT (CURRENT_DATE+30)::text d'))[0].d;
const payment=(unidade_indice,valor,cash=false)=>({unidade_indice,valor,data_recebimento:cash?today:future,forma_pagamento_id:ids.forma,...(cash?{conta_bancaria_id:ids.conta}:{})});
const payload={modo_financeiro:'POR_UNIDADE',cliente_id:ids.cliente,quantidade:3,valor_total:300.02,data_venda:today,
 pagamentos:[payment(0,10,true),payment(1,10,true),payment(2,10,true),payment(0,45),payment(1,45),payment(2,45),payment(0,45.01),payment(1,45.01),payment(2,45)]};
const sell=async(data,req=randomUUID())=>(await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify(data),req]))[0].id;
const snapshot=async()=>JSON.stringify(await q(`SELECT jsonb_build_object('vendas',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM venda_pedidos v),'titulos',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM fin_titulos t),'transacoes',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM fin_transacoes t),'unidades',(SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM est_veiculos v)) d`));
const req=randomUUID(), sale=await sell(payload,req);
const rows=await q(`SELECT it.veiculo_id,it.valor_venda,sum(t.valor_total) total,sum(t.valor_pago) paid,count(t.id)::int n,array_agg(t.parcela_numero ORDER BY t.parcela_numero) nums,array_agg(t.parcela_total) totals FROM venda_lote_itens it JOIN fin_titulos t ON t.venda_pedido_id=it.venda_id AND t.veiculo_id=it.veiculo_id WHERE it.venda_id=$1 GROUP BY it.veiculo_id,it.valor_venda`,[sale]);
assert(rows.length===3,'three independently assigned motorcycles');
for(const r of rows){assert(+r.total===+r.valor_venda && +r.paid===10,'exact cents and downpayment each');assert(r.n===3 && r.nums.join(',')==='1,2,3' && r.totals.every(n=>n===3),'independent installment numbering');}
assert(rows.map(r=>+r.total).sort().join(',')==='100,100.01,100.01','deterministic cent allocation');
const before=await snapshot(); assert(await sell(payload,req)===sale,'idempotent ID');assert(before===await snapshot(),'retry must not mutate anything');
await mustFail('idempotency changed data','SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify({...payload,observacoes:'changed'}),req]);
assert(before===await snapshot(),'conflict must not mutate');
console.log('PASS per-motorcycle cent allocation, interleaved numbering, entries and exact idempotency');
const invalid=[
 ['missing index', {...payload,pagamentos:payload.pagamentos.map(({unidade_indice,...p})=>p)}],
 ['outside index',{...payload,pagamentos:payload.pagamentos.map((p,i)=>i? p:{...p,unidade_indice:3})}],
 ['negative index',{...payload,pagamentos:payload.pagamentos.map((p,i)=>i?p:{...p,unidade_indice:-1})}],
 ['fractional index',{...payload,pagamentos:payload.pagamentos.map((p,i)=>i?p:{...p,unidade_indice:0.5})}],
 ['string index',{...payload,pagamentos:payload.pagamentos.map((p,i)=>i?p:{...p,unidade_indice:'0'})}],
 ['wrong unit totals',{...payload,pagamentos:payload.pagamentos.map(p=>({...p,unidade_indice:0}))}],
 ['missing unit',{...payload,pagamentos:payload.pagamentos.map(p=>({...p,unidade_indice:p.unidade_indice===2?1:p.unidade_indice}))}],
 ['invalid mode',{...payload,modo_financeiro:'UNKNOWN'}],
 ['null mode',{...payload,modo_financeiro:null}],
 ['unit allocation without mode',{...payload,modo_financeiro:undefined}],
 // Totals still match, but an individual title has fractional cents or negative value.
 ['fractional cent',{...payload,pagamentos:payload.pagamentos.map((p,i)=>({...p,valor:p.valor+(i===0?0.001:i===3?-0.001:0)}))}],
 ['late failure after cash write',{...payload,pagamentos:payload.pagamentos.map((p,i)=>i===8?{...p,forma_pagamento_id:randomUUID()}:p)}],
];
for(const [name,data] of invalid){await mustFail(name,'SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(data),randomUUID()]);assert(before===await snapshot(),name+' rollback failed');}
console.log('PASS malformed contracts rejected atomically, including late failure after cash entries');
const legacy={...payload,modo_financeiro:undefined,pagamentos:[{valor:300.02,data_recebimento:future,forma_pagamento_id:ids.forma}]};
const legacySale=await sell(legacy);
const legacyRows=await q('SELECT veiculo_id,valor_total,parcela_numero,parcela_total FROM fin_titulos WHERE venda_pedido_id=$1',[legacySale]);
assert(legacyRows.length===1 && +legacyRows[0].valor_total===300.02,'legacy schedule remains shared');
const detail=(await q('SELECT get_lote_detalhes($1) d',[lote]))[0].d;
assert(detail.vendas.find(v=>v.id===sale).modo_financeiro==='POR_UNIDADE','new mode response');
assert(detail.vendas.find(v=>v.id===legacySale).modo_financeiro==='LEGADO','legacy response');
assert(detail.vendas.every(v=>!('lote_request_payload'in v)),'private request payload not leaked');
const preReplacement=await snapshot();
await db.exec('RESET ROLE');
await db.exec(readFileSync(new URL('../supabase/migrations/20261117145256_lote_financeiro_por_unidade.sql', import.meta.url), 'utf8'));
await db.exec('SET ROLE authenticated');
assert(preReplacement===await snapshot(),'migration must leave existing titles, transactions and vehicle rows byte-for-byte unchanged');
assert((await q("SELECT has_function_privilege('anon','public.get_lote_detalhes(uuid)','EXECUTE') allowed"))[0].allowed===false,'no new anonymous function grant');
console.log('PASS function replacement preserves historical rows and ACL');
await q('SELECT cancelar_venda_lote($1)',[legacySale]);
await mustFail('cannot cancel paid per-unit sale','SELECT cancelar_venda_lote($1)',[sale]);
const unpaid={...payload,pagamentos:payload.pagamentos.map(p=>({...p,conta_bancaria_id:undefined,data_recebimento:future}))};
const unpaidSale=await sell(unpaid);await q('SELECT cancelar_venda_lote($1)',[unpaidSale]);
assert((await q("SELECT count(*)::int n FROM est_veiculos WHERE id IN (SELECT veiculo_id FROM venda_lote_itens WHERE venda_id=$1) AND status='DISPONIVEL'",[unpaidSale]))[0].n===3,'cancel returns all motorcycles');
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[randomUUID()]);
await mustFail('foreign org per-unit','SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(payload),randomUUID()]);
console.log('PASS legacy mode, cancel/unpaid restoration, private payload, organization authorization');
await db.close();
