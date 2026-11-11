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
const foreignBank=randomUUID();
await seed('fin_contas_bancarias',{id:foreignBank,organization_id:ids.other,banco_nome:'Outra',titular:'Outro',saldo_atual:0,ativo:true});
const inactiveBank=randomUUID();
await seed('fin_contas_bancarias',{id:inactiveBank,organization_id:ids.org,banco_nome:'Inativo',titular:'Teste',saldo_atual:0,ativo:false});
const inactiveForm=randomUUID(),wrongForm=randomUUID();
await seed('cad_formas_pagamento',{id:inactiveForm,organization_id:ids.org,nome:'Inativa',tipo_movimentacao:'AMBOS',destino_lancamento:'CAIXA',ativo:false});
await seed('cad_formas_pagamento',{id:wrongForm,organization_id:ids.org,nome:'Só pagamento',tipo_movimentacao:'PAGAMENTO',destino_lancamento:'CAIXA',ativo:true});
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
// Every adjustment test runs inside a rollback, with synthetic data only.
await db.exec('BEGIN');
const sale=(await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify({cliente_id:ids.cliente,quantidade:1,valor_total:1000,data_venda:today,pagamentos:[{valor:1000,data_recebimento:today,forma_pagamento_id:ids.forma}]}),randomUUID()]))[0].id;
const title=(await q('SELECT id FROM fin_titulos WHERE venda_pedido_id=$1',[sale]))[0].id;
const pay=async (value,discount,interest,request=randomUUID(),titleId=title,bank=ids.conta)=>q('SELECT baixar_titulo_lote($1,$2,$3,$4,$5,$6,$7,$8)',[titleId,value,bank,ids.forma,today,request,discount,interest]);
const cash=async()=>+(await q('SELECT saldo_atual FROM fin_contas_bancarias WHERE id=$1',[ids.conta]))[0].saldo_atual;
const state=async()=> (await q('SELECT valor_pago,valor_desconto,valor_acrescimo,valor_pendente,status FROM fin_titulos WHERE id=$1',[title]))[0];
const assert=(condition,label)=>{if(!condition)throw Error(label);};
// Savepoints preserve the outer rollback after intentionally rejected statements.
async function reject(label,operation){await db.exec('SAVEPOINT invalid');let rejected=false;try{await operation();}catch{rejected=true;}await db.exec('ROLLBACK TO SAVEPOINT invalid');assert(rejected,'expected rejection: '+label);console.log('PASS blocked',label);}
const openingCash=await cash();
const interestRequest=randomUUID();
await pay(50,0,50,interestRequest);
assert(await cash()===openingCash+50,'receivable interest-only cash +50');
let t=await state();assert(+t.valor_pago===50 && +t.valor_acrescimo===50 && +t.valor_pendente===1000,'interest-only must preserve principal');
await pay(50,0,50,interestRequest);
assert((await q('SELECT count(*)::int n FROM fin_transacoes WHERE titulo_id=$1',[title]))[0].n===2,'retry must not duplicate cash or interest');
assert(await cash()===openingCash+50,'receivable replay leaves cash unchanged');
await reject('changed adjustment on replay',()=>pay(50,0,51,interestRequest));
await reject('different title on replay',()=>pay(50,0,50,interestRequest,ids.titulo));
await pay(200,10,0);
assert(await cash()===openingCash+250,'receivable partial cash +200, discount excluded');
t=await state();assert(+t.valor_pago===250 && +t.valor_desconto===10 && +t.valor_pendente===790,'partial payment with discount');
await reject('overpayment',()=>pay(791,0,0));
await reject('excess discount',()=>pay(0,791,0));
for(const invalid of [-1,0.001,'NaN','Infinity']) await reject('invalid money '+invalid,()=>pay(10,0,invalid));
await reject('null adjustment',()=>pay(10,null,0));
await reject('zero settlement',()=>pay(0,0,0));
await reject('inactive bank',()=>pay(10,0,0,randomUUID(),title,inactiveBank));
for(const form of [inactiveForm,wrongForm]) await reject('inactive/incompatible payment method',()=>q('SELECT baixar_titulo_lote($1,10,$2,$3,$4,$5,0,1)',[title,ids.conta,form,today,randomUUID()]));
await db.exec('SAVEPOINT closed_lot; RESET ROLE');
await q('UPDATE est_lotes SET encerrado=true WHERE id=$1',[lote]);
await db.exec('SET ROLE authenticated');
await reject('closed lot',()=>pay(10,0,1));
await db.exec('ROLLBACK TO SAVEPOINT closed_lot');
await reject('foreign bank',()=>pay(10,0,0,randomUUID(),title,foreignBank));
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[randomUUID()]);
await reject('foreign tenant',()=>pay(10,0,0));
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[ids.user]);
// Old callers retain their exact signature and old no-adjustment payload shape.
const legacyRequest=randomUUID();
await q('SELECT baixar_titulo_lote($1,10,$2,$3,$4,$5)',[title,ids.conta,ids.forma,today,legacyRequest]);
await pay(10,0,0,legacyRequest);
assert(await cash()===openingCash+260,'legacy retry cash credited exactly once');
assert(+(await state()).valor_pendente===780,'legacy replay across overloads');
const cashBefore=(await q('SELECT saldo_atual FROM fin_contas_bancarias WHERE id=$1',[ids.conta]))[0].saldo_atual;
await pay(0,780,0,randomUUID(),title,null);
t=await state();assert(t.status==='PAGO' && +t.valor_pendente===0 && +t.valor_pago===260,'discount-only closes without fictional cash');
assert((await q('SELECT saldo_atual FROM fin_contas_bancarias WHERE id=$1',[ids.conta]))[0].saldo_atual===cashBefore,'discount must not change cash balance');
await reject('paid title',()=>pay(1,0,1));
const fullSale=(await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify({cliente_id:ids.cliente,quantidade:1,valor_total:1000,data_venda:today,pagamentos:[{valor:1000,data_recebimento:today,forma_pagamento_id:ids.forma}]}),randomUUID()]))[0].id;
const fullTitle=(await q('SELECT id FROM fin_titulos WHERE venda_pedido_id=$1',[fullSale]))[0].id;
const beforeFull=await cash();
await pay(1100,0,100,randomUUID(),fullTitle);
assert(await cash()===beforeFull+1100,'full receivable cash includes principal and interest exactly once');
const full=(await q('SELECT valor_pago,valor_pendente,status FROM fin_titulos WHERE id=$1',[fullTitle]))[0];
assert(+full.valor_pago===1100 && +full.valor_pendente===0 && full.status==='PAGO','principal plus interest settles fully');
// The acquisition title is PAGAR: adjustments change debt, cash only follows payment.
const payableState=async()=> (await q('SELECT valor_pago,valor_desconto,valor_acrescimo,valor_pendente,status FROM fin_titulos WHERE id=$1',[ids.titulo]))[0];
const payableCash=await cash();
const payableRequest=randomUUID();
await pay(100,0,100,payableRequest,ids.titulo);
let payable=await payableState();
assert(+payable.valor_pendente===304000 && +payable.valor_pago===100 && +payable.valor_acrescimo===100,'payable interest-only preserves principal');
assert(await cash()===payableCash-100,'payable interest-only cash -100');
await pay(100,0,100,payableRequest,ids.titulo);
assert(await cash()===payableCash-100,'payable replay leaves cash unchanged');
await pay(1000,50,20,randomUUID(),ids.titulo);
payable=await payableState();
assert(+payable.valor_pendente===302970 && +payable.valor_pago===1100 && +payable.valor_desconto===50 && +payable.valor_acrescimo===120,'payable partial with interest and discount');
assert(await cash()===payableCash-1100,'payable partial cash -1000 excludes adjustments');
await pay(302900,100,30,randomUUID(),ids.titulo);
payable=await payableState();
assert(+payable.valor_pendente===0 && payable.status==='PAGO' && +payable.valor_pago===304000,'payable full with interest and discount');
assert(await cash()===payableCash-304000,'payable total cash equals actual payments');
console.log('PASS RECEBER and PAGAR cash deltas, principal, interest, discounts and retries');
await reject('missing title',()=>pay(1,0,1,randomUUID(),randomUUID()));
assert(!(await q("SELECT has_function_privilege('anon','public.baixar_titulo_lote(uuid,numeric,uuid,uuid,date,uuid,numeric,numeric)','EXECUTE') allowed"))[0].allowed,'anonymous execution');
assert(!(await q("SELECT has_function_privilege('anon','drivecar_private.baixar_titulo_lote_impl(uuid,numeric,uuid,uuid,date,uuid,numeric,numeric)','EXECUTE') allowed"))[0].allowed,'anonymous private execution');
await db.exec('ROLLBACK');
assert((await q('SELECT count(*)::int n FROM venda_pedidos WHERE id=$1',[sale]))[0].n===0,'rollback cleanup');
await db.close();
console.log('PASS interest-only, partial, discount, retries, tenant/lot isolation, ACL, rollback');
