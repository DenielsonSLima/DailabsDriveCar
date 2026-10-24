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
const req=randomUUID(); const desp={descricao:'Frete',valor_total:10000.03,data_vencimento:today,categoria_id:ids.categoria,fornecedor_id:ids.cliente,pago_agora:true,conta_bancaria_id:ids.conta,forma_pagamento_id:ids.forma};
const despId=(await q('SELECT registrar_despesa_lote($1,$2,$3) id',[lote,JSON.stringify(desp),req]))[0].id;
await q('SELECT registrar_despesa_lote($1,$2,$3)',[lote,JSON.stringify(desp),req]);
const sum=(await q('SELECT sum(valor_custo_servicos)::numeric total FROM est_veiculos WHERE lote_id=$1',[lote]))[0].total;
if(+sum!==10000.03)throw Error('expense allocation '+sum);

const future=(await q("SELECT (CURRENT_DATE+30)::text d"))[0].d;
const saleData={cliente_id:ids.cliente,quantidade:10,valor_total:80000,data_venda:today,pagamentos:[{valor:55000,data_recebimento:today,conta_bancaria_id:ids.conta,forma_pagamento_id:ids.forma},{valor:25000,data_recebimento:future,forma_pagamento_id:ids.forma}]};
const saleReq=randomUUID(); const sale=(await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify(saleData),saleReq]))[0].id;
await q('SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(saleData),saleReq]);
console.log('PASS partial lot sale with cash and receivable');
const tit=await q('SELECT valor_total,valor_pago,status FROM fin_titulos WHERE venda_pedido_id=$1 ORDER BY valor_total',[sale]);
if(tit.length!==2 || tit.reduce((s,x)=>s+Number(x.valor_pago),0)!==55000)throw Error('payment invalid '+JSON.stringify(tit));
await mustFail('cancel received','SELECT cancelar_venda_lote($1)',[sale]);
await mustFail('over sell','SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify({...saleData,quantidade:41}),randomUUID()]);
const d2={...desp,descricao:'Mecanico',valor_total:6000,pago_agora:false};
await q('SELECT registrar_despesa_lote($1,$2,$3)',[lote,JSON.stringify(d2),randomUUID()]);
const lateCosts = (await q('SELECT valor_custo_veiculo,(SELECT sum(custo_na_venda) FROM venda_lote_itens WHERE venda_id=$1) frozen FROM venda_pedidos WHERE id=$1',[sale]))[0];
if (+lateCosts.valor_custo_veiculo !== 64000.03 || +lateCosts.frozen !== 62800.03) throw Error('late current cost or original snapshot invalid');
console.log('PASS late expense changes current cost and preserves snapshot');
const detail=(await q('SELECT get_lote_detalhes($1) d',[lote]))[0].d;
if(detail.unidades.length!==50 ||detail.despesas.length!==2||detail.vendas.length!==1||detail.titulos.length!==5)throw Error('detail invalid '+JSON.stringify(Object.fromEntries(Object.entries(detail).map(([k,v])=>[k,Array.isArray(v)?v.length:typeof v]))));
console.log('details/list passed',(await q('SELECT listar_lotes(null,$1) d',['motos']))[0].d.length);
await mustFail('close active','SELECT encerrar_lote($1)',[lote]);
const unit=detail.unidades.find(x=>x.status==='DISPONIVEL').id;
await q('SELECT identificar_unidade_lote($1,$2,$3)',[unit,' abc123 ',' abc1a23 ']);
await mustFail('duplicate identification','SELECT identificar_unidade_lote($1,$2,$3)',[detail.unidades[0].id,'ABC123',null]);
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[randomUUID()]);
await mustFail('foreign org get','SELECT get_lote_detalhes($1)',[lote]);
await mustFail('foreign org mutate','SELECT registrar_despesa_lote($1,$2,$3)',[lote,JSON.stringify(desp),randomUUID()]);
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[ids.user]);

const allReports=[
 ['get_caixa_metrics',`SELECT get_caixa_metrics(CURRENT_DATE-1,CURRENT_DATE+60) d`],
 ['get_caixa_comparativo_mensal',`SELECT get_caixa_comparativo_mensal(CURRENT_DATE::timestamptz,(CURRENT_DATE+60)::timestamptz) d`],
 ['get_performance_overview',`SELECT get_performance_overview(CURRENT_DATE::timestamptz,(CURRENT_DATE+60)::timestamptz) d`],
 ['get_dashboard_history',`SELECT * FROM get_dashboard_history(3)`],
 ['get_saldos_socios',`SELECT get_saldos_socios() d`],
 ['get_caixa_patrimonio_socios',`SELECT * FROM get_caixa_patrimonio_socios(CURRENT_DATE-1,CURRENT_DATE+60)`],
 ['get_patrimonio_liquido_at_date',`SELECT get_patrimonio_liquido_at_date($1,CURRENT_TIMESTAMP) d`,[ids.org]],
 ['get_despesas_variaveis_kpis',`SELECT get_despesas_variaveis_kpis('TODOS') d`],
];
for(const [name,sql,args=[]] of allReports){const rows=await q(sql,args);console.log('PASS report',name); if(name==='get_caixa_metrics' && +rows[0].d.total_custo_vendas!==64000.03)throw Error('global current sale cost invalid'); if(name==='get_performance_overview' && +rows[0].d.total_vendas_qtd!==10)throw Error('global quantity invalid');}
// Payment retries preserve exactly one partial payment.
const partialTitle=(await q('SELECT id FROM fin_titulos WHERE venda_pedido_id=$1 AND valor_pago=0',[sale]))[0].id;
const partialReq=randomUUID();
await q('SELECT baixar_titulo_lote($1,5000,$2,$3,CURRENT_DATE,$4)',[partialTitle,ids.conta,ids.forma,partialReq]);
await q('SELECT baixar_titulo_lote($1,5000,$2,$3,CURRENT_DATE,$4)',[partialTitle,ids.conta,ids.forma,partialReq]);
if(+(await q('SELECT valor_pago FROM fin_titulos WHERE id=$1',[partialTitle]))[0].valor_pago!==5000)throw Error('partial payment duplicate');
await db.exec('RESET ROLE'); await seed('fin_contas_bancarias',{id:'12345678-1234-4123-8123-123456789012',organization_id:ids.other,banco_nome:'Outro',titular:'Outro',ativo:true}); await db.exec('SET ROLE authenticated');
await mustFail('foreign account payment','SELECT baixar_titulo_lote($1,1,$2,$3,CURRENT_DATE,$4)',[partialTitle,'12345678-1234-4123-8123-123456789012',ids.forma,randomUUID()]);
await mustFail('overpayment','SELECT baixar_titulo_lote($1,25000,$2,$3,CURRENT_DATE,$4)',[partialTitle,ids.conta,ids.forma,randomUUID()]);
await mustFail('legacy payment','SELECT baixar_titulo($1,1,$2,$3)',[partialTitle,ids.conta,ids.forma]);
await mustFail('mismatched payment request','SELECT baixar_titulo_lote($1,4999,$2,$3,CURRENT_DATE,$4)',[partialTitle,ids.conta,ids.forma,partialReq]);
// Sale without bank movement can be cancelled and all units return to stock.
const unpaidData={...saleData,quantidade:2,valor_total:16000,pagamentos:[{valor:16000,data_recebimento:future,forma_pagamento_id:ids.forma}]};
const unpaid=(await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify(unpaidData),randomUUID()]))[0].id;
await q('SELECT cancelar_venda_lote($1)',[unpaid]);
if(+(await q(`SELECT count(*) n FROM est_veiculos WHERE lote_id=$1 AND status='DISPONIVEL'`,[lote]))[0].n!==40)throw Error('cancel did not restore all units');
await q('SELECT cancelar_venda_lote($1)',[unpaid]);
// Last 40 units; then settle every open title through the guarded payment path.
const finalData={...saleData,quantidade:40,valor_total:320000,pagamentos:[{valor:320000,data_recebimento:today,conta_bancaria_id:ids.conta,forma_pagamento_id:ids.forma}]};
await q('SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(finalData),randomUUID()]);
await mustFail('close with debts','SELECT encerrar_lote($1)',[lote]);
for(const t of await q(`SELECT id,valor_pendente FROM fin_titulos WHERE lote_id=$1 AND status NOT IN ('PAGO','CANCELADO')`,[lote]))await q('SELECT baixar_titulo_lote($1,$2,$3,$4,CURRENT_DATE,$5)',[t.id,t.valor_pendente,ids.conta,ids.forma,randomUUID()]);
await q('SELECT encerrar_lote($1)',[lote]);
await q('SELECT encerrar_lote($1)',[lote]);
await mustFail('closed late cost','SELECT registrar_despesa_lote($1,$2,$3)',[lote,JSON.stringify(desp),randomUUID()]);
await q('SELECT identificar_unidade_lote($1,$2,$3)',[unit,'new-chassi','new-plate']);
console.log('PASS all local scenarios');

// A vehicle outside a lot keeps the pre-existing sale-cost and payment flow.
const legacyPedido = randomUUID();
const legacyVehicle = randomUUID();
const legacySale = randomUUID();
const legacyTitle = randomUUID();
await seed('cmp_pedidos', {
  id: legacyPedido, organization_id: ids.org, numero_pedido: 101,
  status: 'CONCLUIDO', valor_negociado: 25000,
});
await seed('est_veiculos', {
  id: legacyVehicle, organization_id: ids.org, pedido_id: legacyPedido,
  status: 'DISPONIVEL', valor_custo: 25000, valor_custo_servicos: 1000,
});
await q(`INSERT INTO venda_pedidos(id,organization_id,cliente_id,veiculo_id,valor_venda,status)
  VALUES($1,$2,$3,$4,36000,'CONCLUIDO')`, [legacySale, ids.org, ids.cliente, legacyVehicle]);
let legacyFinancials = (await q('SELECT valor_custo_veiculo,valor_lucro FROM venda_pedidos WHERE id=$1', [legacySale]))[0];
if (+legacyFinancials.valor_custo_veiculo !== 26000 || +legacyFinancials.valor_lucro !== 10000) {
  throw Error('non-lot sale insertion changed its legacy cost calculation');
}
await q('UPDATE est_veiculos SET valor_custo=27000 WHERE id=$1', [legacyVehicle]);
await q('UPDATE venda_pedidos SET valor_venda=37000 WHERE id=$1', [legacySale]);
legacyFinancials = (await q('SELECT valor_custo_veiculo,valor_lucro FROM venda_pedidos WHERE id=$1', [legacySale]))[0];
if (+legacyFinancials.valor_custo_veiculo !== 28000 || +legacyFinancials.valor_lucro !== 9000) {
  throw Error('non-lot sale update changed its legacy cost calculation');
}
await q(`INSERT INTO fin_titulos(id,organization_id,veiculo_id,venda_pedido_id,descricao,tipo,
  valor_total,data_vencimento,origem_tipo,origem_id)
  VALUES($1,$2,$3,$4,'Synthetic legacy receipt','RECEBER',2000,CURRENT_DATE,'PEDIDO_VENDA',$4)`,
  [legacyTitle, ids.org, legacyVehicle, legacySale]);
await q('SELECT baixar_titulo($1,500,$2,$3)', [legacyTitle, ids.conta, ids.forma]);
const legacyReceipt = (await q('SELECT valor_pago,status FROM fin_titulos WHERE id=$1', [legacyTitle]))[0];
if (+legacyReceipt.valor_pago !== 500 || legacyReceipt.status !== 'PARCIAL') {
  throw Error('ordinary legacy payment was blocked or changed by lot guards');
}
console.log('PASS non-lot sale cost, edits and legacy partial payment');

await db.exec('RESET ROLE');
await db.exec(`CREATE SEQUENCE fixture_compra_seq START 500; GRANT USAGE ON SEQUENCE fixture_compra_seq TO authenticated; ALTER TABLE cmp_pedidos ALTER COLUMN numero_pedido SET DEFAULT nextval('fixture_compra_seq');`);
const rollbackScenario=readFileSync(new URL('../supabase/tests/lotes_rollback.sql', import.meta.url),'utf8').replace('00000000-0000-0000-0000-000000000000',ids.user);
const beforeRollback=await q('SELECT count(*) n FROM est_lotes');
await db.exec(rollbackScenario);
const afterRollback=await q('SELECT count(*) n FROM est_lotes');
if(+beforeRollback[0].n!==+afterRollback[0].n)throw Error('rollback leaked rows');
console.log('PASS durable rollback SQL scenarios, no retained rows');
await db.close();
