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

const initialUnits=await q('SELECT id,lote_ordem FROM est_veiculos WHERE lote_id=$1 ORDER BY lote_ordem',[lote]);
await q('SELECT baixar_titulo_lote($1,304000,$2,$3,CURRENT_DATE,$4)',[ids.titulo,ids.conta,ids.forma,randomUUID()]);
const transactionsBefore=await q('SELECT to_jsonb(t) row FROM fin_transacoes t ORDER BY id');
const financeBefore=await q('SELECT to_jsonb(t) row FROM fin_titulos t ORDER BY id');
const purchaseBefore=await q('SELECT to_jsonb(p) row FROM cmp_pedidos p ORDER BY id');
const accountBefore=await q('SELECT to_jsonb(a) row FROM fin_contas_bancarias a ORDER BY id');
const ajusteSql='SELECT ajustar_quantidade_lote($1,$2,$3,$4,$5)';
const change=async (quantity,current,description='Lote de '+quantity+' motos elétricas',request=randomUUID())=>{
  await q(ajusteSql,[lote,quantity,description,current,request]); return request;
};
const check=async quantity=>{
  const r=(await q(`SELECT count(*)::int n,sum(valor_custo)::numeric cost,min(lote_ordem)::int first,max(lote_ordem)::int last
    FROM est_veiculos WHERE lote_id=$1`,[lote]))[0];
  if(r.n!==quantity||+r.cost!==304000||r.first!==1||r.last!==quantity)throw Error('quantity/allocation '+JSON.stringify(r));
  const investor=(await q(`SELECT sum((x->>'valor')::numeric) total FROM est_veiculos v CROSS JOIN LATERAL jsonb_array_elements(v.socios) x WHERE lote_id=$1`,[lote]))[0];
  const costs=(await q('SELECT sum(valor_custo+valor_custo_servicos) total FROM est_veiculos WHERE lote_id=$1',[lote]))[0];
  if(+investor.total!==+costs.total)throw Error('investor total diverged');
};
const req=await change(40,50);
await check(40);
if((await q('SELECT DISTINCT valor_custo cost FROM est_veiculos WHERE lote_id=$1',[lote])).some(x=>+x.cost!==7600))throw Error('40 unit cost');
const detail=(await q('SELECT get_lote_detalhes($1) d',[lote]))[0].d;
if(detail.lote.descricao!=='Lote de 40 motos elétricas'||detail.lote.quantidade_inicial!==40||detail.unidades.length!==40)throw Error('details mismatch');
const summary=(await q('SELECT listar_lotes(null,$1) d',['40 motos']))[0].d[0];
if(+summary.quantidade_disponivel!==40||+summary.quantidade_vendida!==0)throw Error('stock summary mismatch');
await change(40,50,'Lote de 40 motos elétricas',req);
await mustFail('request mismatch',ajusteSql,[lote,39,'Outro',40,req]);
await mustFail('stale quantity',ajusteSql,[lote,39,'Outro',50,randomUUID()]);
for(const qty of [null,0,1,10001])await mustFail('invalid quantity '+qty,ajusteSql,[lote,qty,'Outro',40,randomUUID()]);
await mustFail('blank description',ajusteSql,[lote,39,' ',40,randomUUID()]);
await mustFail('no request id',ajusteSql,[lote,39,'Outro',40,null]);
await db.exec('RESET ROLE');
if(+(await q('SELECT count(*) n FROM drivecar_private.lote_unidades_arquivadas WHERE lote_id=$1 AND restored_at IS NULL',[lote]))[0].n!==10)throw Error('missing archive');
if(+(await q('SELECT count(*) n FROM drivecar_private.lote_quantidade_ajustes WHERE lote_id=$1',[lote]))[0].n!==1)throw Error('retry created audit');
await db.exec('SET ROLE authenticated');
await mustFail('private audit access','SELECT * FROM drivecar_private.lote_quantidade_ajustes');
await change(45,40);
const restoredDescriptions=await q('SELECT observacoes FROM est_veiculos WHERE lote_id=$1 AND lote_ordem BETWEEN 41 AND 45',[lote]);
if(restoredDescriptions.some(row=>row.observacoes!=='Unidade interna do lote: Lote de 45 motos elétricas'))throw Error('restored automatic description stale');
await change(50,45);
await check(50);
const restoredUnits=await q('SELECT id,lote_ordem FROM est_veiculos WHERE lote_id=$1 ORDER BY lote_ordem',[lote]);
if(JSON.stringify(initialUnits)!==JSON.stringify(restoredUnits))throw Error('archive restore changed ids');
await change(55,50); await check(55);
await change(40,55); await check(40);
console.log('PASS 50 -> 40 -> 50 restores original IDs; increase creates units; retry is idempotent');
const unit40=(await q('SELECT id FROM est_veiculos WHERE lote_id=$1 AND lote_ordem=40',[lote]))[0].id;
await q('SELECT identificar_unidade_lote($1,$2,$3)',[unit40,'PROTECTED-CHASSIS',null]);
await mustFail('identified tail',ajusteSql,[lote,39,'Lote 39',40,randomUUID()]);
await check(40);
await q('SELECT identificar_unidade_lote($1,$2,$3)',[unit40,null,null]);
// Unknown cascading references are checked before a removal can cascade.
await db.exec('RESET ROLE');
await db.exec('CREATE TABLE public.fixture_vehicle_ref(id uuid PRIMARY KEY,veiculo_id uuid REFERENCES public.est_veiculos(id) ON DELETE CASCADE)');
await q('INSERT INTO fixture_vehicle_ref VALUES($1,$2)',[randomUUID(),unit40]);
await db.exec('SET ROLE authenticated');
await mustFail('unknown cascading reference',ajusteSql,[lote,39,'Lote 39',40,randomUUID()]);
await db.exec('RESET ROLE'); await db.exec('DROP TABLE public.fixture_vehicle_ref'); await db.exec('SET ROLE authenticated');
await change(3,40); await check(3);
const cents=await q('SELECT valor_custo cost FROM est_veiculos WHERE lote_id=$1 ORDER BY lote_ordem',[lote]);
if(cents.map(x=>+x.cost).join(',')!=='101333.34,101333.33,101333.33')throw Error('cent allocation');
await change(40,3); await check(40);
const expense={descricao:'Frete sintético',valor_total:10000.03,data_vencimento:today,categoria_id:ids.categoria,fornecedor_id:ids.cliente,pago_agora:false};
await q('SELECT registrar_despesa_lote($1,$2,$3)',[lote,JSON.stringify(expense),randomUUID()]);
await change(39,40);await check(39);
if(+(await q('SELECT sum(valor_custo_servicos) total FROM est_veiculos WHERE lote_id=$1',[lote]))[0].total!==10000.03)throw Error('expense reallocation');
const unit39=(await q('SELECT id FROM est_veiculos WHERE lote_id=$1 AND lote_ordem=39',[lote]))[0].id;
await q('SELECT registrar_despesa_lote($1,$2,$3)',[lote,JSON.stringify({...expense,descricao:'Específica',valor_total:500,veiculo_id:unit39}),randomUUID()]);
await mustFail('specific expense tail',ajusteSql,[lote,38,'Lote 38',39,randomUUID()]);
await change(40,39);await check(40);
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[randomUUID()]);
await mustFail('foreign org quantity',ajusteSql,[lote,39,'Lote 39',40,randomUUID()]);
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[ids.user]);
await db.exec('SET ROLE anon');
await mustFail('anonymous RPC',ajusteSql,[lote,39,'Lote 39',40,randomUUID()]);
await db.exec('SET ROLE authenticated');
// Guard existing financial rows byte for byte. New synthetic expense titles excluded.
const financeAfter=await q('SELECT to_jsonb(t) row FROM fin_titulos t WHERE id=$1 ORDER BY id',[ids.titulo]);
const purchaseAfter=await q('SELECT to_jsonb(p) row FROM cmp_pedidos p ORDER BY id');
const accountAfter=await q('SELECT to_jsonb(a) row FROM fin_contas_bancarias a ORDER BY id');
const transactionsAfter=await q('SELECT to_jsonb(t) row FROM fin_transacoes t ORDER BY id');
if(JSON.stringify(transactionsBefore)!==JSON.stringify(transactionsAfter))throw Error('existing payment transaction changed');
if(JSON.stringify(financeBefore)!==JSON.stringify(financeAfter)||JSON.stringify(purchaseBefore)!==JSON.stringify(purchaseAfter)||JSON.stringify(accountBefore)!==JSON.stringify(accountAfter))throw Error('financial or purchase records changed');
const future=(await q("SELECT (CURRENT_DATE+30)::text d"))[0].d;
const saleData={cliente_id:ids.cliente,quantidade:1,valor_total:9000,data_venda:today,pagamentos:[{valor:9000,data_recebimento:future,forma_pagamento_id:ids.forma}]};
const sale=(await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify(saleData),randomUUID()]))[0].id;
await mustFail('sale history',ajusteSql,[lote,39,'Lote 39',40,randomUUID()]);
await q('SELECT cancelar_venda_lote($1)',[sale]);
await mustFail('cancelled sale history',ajusteSql,[lote,39,'Lote 39',40,randomUUID()]);
await db.exec('RESET ROLE'); await q('UPDATE est_lotes SET encerrado=true WHERE id=$1',[lote]);await db.exec('SET ROLE authenticated');
await mustFail('closed lot',ajusteSql,[lote,39,'Lote 39',40,randomUUID()]);
console.log('PASS cents, expenses, preserved financial records, tenant isolation, protected units and closed/sold lots');
await db.close();
