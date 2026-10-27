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
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '/tmp/drivecar-lotes-pglite/node_modules/@electric-sql/pglite/dist/index.js');
const db = new PGlite();
await db.exec(readFileSync(new URL('./fixtures/lotes-schema.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261024163146_lotes_veiculos_custos_vendas.sql', import.meta.url), 'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/20261024163638_index_lotes_foreign_keys.sql', import.meta.url), 'utf8'));

console.log('PASS operation migration applied to isolated fixture');
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
await q('SELECT public.baixar_titulo($1,304000,$2,$3,now())',[ids.titulo,ids.conta,ids.forma]);
const legacyPurchasePayment=(await q('SELECT id FROM fin_transacoes WHERE titulo_id=$1',[ids.titulo]))[0].id;
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
// A request written by the old client must remain resumable after upgrade.
const oldPayload={cliente_id:ids.cliente,quantidade:1,valor_total:8000,data_venda:today,pagamentos:[{valor:8000,data_recebimento:today,forma_pagamento_id:ids.forma}]};
const oldReq=randomUUID();
const oldSale=(await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify(oldPayload),oldReq]))[0].id;
await db.exec('RESET ROLE');
await db.exec(readFileSync(new URL('../supabase/migrations/20261027014706_lotes_operacao_unidades_correcoes_financeiras.sql', import.meta.url), 'utf8'));
await db.exec('SET ROLE authenticated');
if((await q('SELECT registrar_venda_lote($1,$2,$3) id',[lote,JSON.stringify(oldPayload),oldReq]))[0].id!==oldSale)throw Error('old request replay');
console.log('PASS old sale request replay after migration');
const equal = (got, expected, label) => { if (JSON.stringify(got)!==JSON.stringify(expected)) throw Error(label+': '+JSON.stringify(got)+' != '+JSON.stringify(expected)); };
const scalar = async (sql, params=[]) => Object.values((await q(sql,params))[0])[0];
const units = await q('SELECT id,lote_ordem FROM est_veiculos WHERE lote_id=$1 ORDER BY lote_ordem',[lote]);
const bank = async()=>Number(await scalar('SELECT saldo_atual FROM fin_contas_bancarias WHERE id=$1',[ids.conta]));
const sumCosts = async()=>Number(await scalar('SELECT sum(valor_custo_servicos) FROM est_veiculos WHERE lote_id=$1',[lote]));
const expenseData = {descricao:'Frete em teste',valor_total:1000.03,data_vencimento:today,categoria_id:ids.categoria,fornecedor_id:ids.cliente,pago_agora:false};
const expense = await scalar('SELECT registrar_despesa_lote($1,$2,$3)',[lote,JSON.stringify(expenseData),randomUUID()]);
const expenseTitle = await scalar('SELECT titulo_id FROM est_lote_despesas WHERE id=$1',[expense]);
const edited = {...expenseData,descricao:'Frete corrigido',valor_total:2000.03,veiculo_id:units[16].id};
const editReq=randomUUID();
await q('SELECT corrigir_despesa_lote($1,$2,$3,$4)',[expense,JSON.stringify(edited),'Corrigido valor e aplicação',editReq]);
await q('SELECT corrigir_despesa_lote($1,$2,$3,$4)',[expense,JSON.stringify(edited),'Corrigido valor e aplicação',editReq]);
equal(await sumCosts(),2000.03,'corrected costs');
equal(Number(await scalar('SELECT valor_custo_servicos FROM est_veiculos WHERE id=$1',[units[16].id])),2000.03,'specific unit cost');
await mustFail('request conflict','SELECT corrigir_despesa_lote($1,$2,$3,$4)',[expense,JSON.stringify({...edited,valor_total:1}),'Outro valor',editReq]);
const saleData = {cliente_id:ids.cliente,quantidade:1,veiculo_ids:[units[16].id],valor_total:10000,data_venda:today,pagamentos:[{valor:10000,data_recebimento:today,forma_pagamento_id:ids.forma}]};
await mustFail('explicit ids required','SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify({...saleData,veiculo_ids:undefined}),randomUUID()]);
await mustFail('duplicate ids','SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify({...saleData,quantidade:2,veiculo_ids:[units[0].id,units[0].id]}),randomUUID()]);
await mustFail('foreign ids','SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify({...saleData,veiculo_ids:[ids.cliente]}),randomUUID()]);
const saleReq=randomUUID();
const sale=await scalar('SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(saleData),saleReq]);
equal(await scalar('SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(saleData),saleReq]),sale,'sale retry');
equal(await scalar('SELECT status FROM est_veiculos WHERE id=$1',[units[16].id]),'VENDIDO','explicit unit sold');
equal(await scalar('SELECT status FROM est_veiculos WHERE id=$1',[units[1].id]),'DISPONIVEL','fifo unit remains');
equal(Number(await scalar('SELECT valor_custo_veiculo FROM venda_pedidos WHERE id=$1',[sale])),8080.03,'explicit sold cost');
await mustFail('sold id','SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(saleData),randomUUID()]);
console.log('PASS explicit units validation and accurate cost');
const paidReq=randomUUID(); const startBank=await bank();
await q('SELECT baixar_titulo_lote($1,2000.03,$2,$3,$4,$5)',[expenseTitle,ids.conta,ids.forma,today,paidReq]);
equal(await bank(),startBank-2000.03,'expense payment balance');
await mustFail('paid expense correction','SELECT corrigir_despesa_lote($1,$2,$3,$4)',[expense,JSON.stringify(edited),'Não pode corrigir paga',randomUUID()]);
const paidTx=await scalar('SELECT id FROM fin_transacoes WHERE titulo_id=$1',[expenseTitle]);
await mustFail('forged pointer without title',"INSERT INTO fin_transacoes(organization_id,titulo_id,conta_origem_id,valor,tipo,tipo_transacao,estorno_de_id) VALUES($1,NULL,$2,2000.03,'ENTRADA','ESTORNO_LOTE',$3)",[ids.org,ids.conta,paidTx]);
await mustFail('forged pointer foreign title',"INSERT INTO fin_transacoes(organization_id,titulo_id,conta_origem_id,valor,tipo,tipo_transacao,estorno_de_id) VALUES($1,$2,$3,2000.03,'ENTRADA','ESTORNO_LOTE',$4)",[ids.org,ids.titulo,ids.conta,paidTx]);
const reversalReq=randomUUID();
const reversal=await scalar('SELECT estornar_baixa_lote($1,$2,$3,$4)',[paidTx,'Conta informada incorretamente',today,reversalReq]);
equal(await scalar('SELECT estornar_baixa_lote($1,$2,$3,$4)',[paidTx,'Conta informada incorretamente',today,reversalReq]),reversal,'reversal retry');
equal(await bank(),startBank,'expense reversal balance');
equal(Number(await scalar('SELECT valor_pago FROM fin_titulos WHERE id=$1',[expenseTitle])),0,'title reopened');
equal(Number(await scalar('SELECT count(*) FROM fin_transacoes WHERE titulo_id=$1',[expenseTitle])),2,'original plus reversal');
await mustFail('double reversal','SELECT estornar_baixa_lote($1,$2,$3,$4)',[paidTx,'Não repetir estorno',today,randomUUID()]);
await mustFail('reverse reversal','SELECT estornar_baixa_lote($1,$2,$3,$4)',[reversal,'Não estornar compensação',today,randomUUID()]);
await mustFail('legacy delete still blocked','DELETE FROM fin_transacoes WHERE id=$1',[paidTx]);
const cancelReq=randomUUID();
await q('SELECT cancelar_despesa_lote($1,$2,$3)',[expense,'Despesa registrada em duplicidade',cancelReq]);
await q('SELECT cancelar_despesa_lote($1,$2,$3)',[expense,'Despesa registrada em duplicidade',cancelReq]);
equal(await scalar('SELECT cancelada FROM est_lote_despesas WHERE id=$1',[expense]),true,'soft cancellation');
equal(await sumCosts(),0,'canceled costs excluded');
equal(Number(await scalar('SELECT valor_custo_veiculo FROM venda_pedidos WHERE id=$1',[sale])),6080,'sold updated cost');
equal(Number(await scalar('SELECT custo_na_venda FROM venda_lote_itens WHERE venda_id=$1',[sale])),8080.03,'frozen original cost');
console.log('PASS expense corrections, immutable reversal, history, repricing');
const saleTitle=await scalar('SELECT id FROM fin_titulos WHERE venda_pedido_id=$1',[sale]);
await q('SELECT baixar_titulo_lote($1,3000,$2,$3,$4,$5)',[saleTitle,ids.conta,ids.forma,today,randomUUID()]);
await q('SELECT baixar_titulo_lote($1,2500,$2,$3,$4,$5)',[saleTitle,ids.conta,ids.forma,today,randomUUID()]);
equal(await bank(),startBank+5500,'client partial receipts');
const partnersBefore=(await scalar('SELECT get_saldos_socios()')).reduce((sum,partner)=>sum+Number(partner.total_lucro_vendas),0);
const returnReq=randomUUID();
const returnId=await scalar('SELECT devolver_venda_lote($1,$2,$3,$4)',[sale,'Cliente devolveu a unidade inteira',today,returnReq]);
equal(await scalar('SELECT devolver_venda_lote($1,$2,$3,$4)',[sale,'Cliente devolveu a unidade inteira',today,returnReq]),returnId,'return retry');
equal(await bank(),startBank,'refund exact actual cash');
equal(Number(await scalar('SELECT valor_pago FROM fin_titulos WHERE id=$1',[saleTitle])),0,'refunded title paid zero');
equal(await scalar('SELECT status FROM fin_titulos WHERE id=$1',[saleTitle]),'CANCELADO','refund title canceled');
equal(await scalar('SELECT status FROM venda_pedidos WHERE id=$1',[sale]),'CANCELADO','sale canceled');
const partnersAfter=(await scalar('SELECT get_saldos_socios()')).reduce((sum,partner)=>sum+Number(partner.total_lucro_vendas),0);
if(Math.abs((partnersBefore-partnersAfter)-3920)>0.02)throw Error('partner result did not reverse with returned sale');
equal(await scalar('SELECT status FROM est_veiculos WHERE id=$1',[units[16].id]),'DISPONIVEL','unit restocked');
equal(Number(await scalar('SELECT count(*) FROM fin_transacoes WHERE titulo_id=$1',[saleTitle])),4,'two originals two refunds');
await mustFail('return twice','SELECT devolver_venda_lote($1,$2,$3,$4)',[sale,'Não devolver novamente',today,randomUUID()]);
const details=await scalar('SELECT get_lote_detalhes($1)',[lote]);
equal(details.transacoes.length,7,'cash ledger detail');
equal(details.historico.length,4,'audit events deduplicated');
if(!details.transacoes.every(t=>t.conta_nome==='Teste'))throw Error('missing account names');
const metrics=await scalar('SELECT get_caixa_metrics(CURRENT_DATE,CURRENT_DATE)');
equal(Number(metrics.total_entradas),7500.03,'cash inflows survive canceled titles');
equal(Number(metrics.total_saidas),311500.03,'cash outflows survive canceled titles');
const performance=await scalar("SELECT get_performance_overview(CURRENT_DATE::timestamptz,(CURRENT_DATE+1)::timestamptz)");
equal(Number(performance.total_entradas),7500.03,'performance actual inflows');
equal(Number(performance.total_saidas),311500.03,'performance actual outflows');
equal(Number(performance.despesas_veiculos),0,'canceled expense excluded from performance');
const purchaseBank=await bank();
await q('SELECT estornar_baixa_lote($1,$2,$3,$4)',[legacyPurchasePayment,'Baixa anterior à criação do lote',today,randomUUID()]);
equal(await bank(),purchaseBank+304000,'legacy acquisition reversal bank');
equal(Number(await scalar('SELECT valor_pago FROM fin_titulos WHERE id=$1',[ids.titulo])),0,'legacy acquisition title reopened');
console.log('PASS refund actual received, preserved cash metrics and pre-conversion acquisition reversal');
// Refund validation failure rolls back all earlier compensations within the call.
const yesterday=await scalar("SELECT (CURRENT_DATE-1)::text");
const secondPayload={...saleData,veiculo_ids:[units[20].id],data_venda:yesterday,pagamentos:[{valor:3000,data_recebimento:yesterday,conta_bancaria_id:ids.conta,forma_pagamento_id:ids.forma},{valor:7000,data_recebimento:today,conta_bancaria_id:ids.conta,forma_pagamento_id:ids.forma}]};
const secondSale=await scalar('SELECT registrar_venda_lote($1,$2,$3)',[lote,JSON.stringify(secondPayload),randomUUID()]);
const secondTitleIds=await q('SELECT id FROM fin_titulos WHERE venda_pedido_id=$1 ORDER BY id',[secondSale]);
const paidBefore=await bank();
const countBefore=Number(await scalar('SELECT count(*) FROM fin_transacoes'));
await mustFail('refund date before payment','SELECT devolver_venda_lote($1,$2,$3,$4)',[secondSale,'Devolução anterior ao último recebido',yesterday,randomUUID()]);
equal(await bank(),paidBefore,'failed refund leaves bank');
equal(Number(await scalar('SELECT count(*) FROM fin_transacoes')),countBefore,'failed refund leaves ledger');
equal(await scalar('SELECT status FROM venda_pedidos WHERE id=$1',[secondSale]),'CONCLUIDO','failed refund leaves sale');
equal(await scalar('SELECT status FROM est_veiculos WHERE id=$1',[units[20].id]),'VENDIDO','failed refund leaves unit');
await mustFail('future reversal','SELECT estornar_baixa_lote($1,$2,CURRENT_DATE+1,$3)',[paidTx,'Data futura bloqueada',randomUUID()]);
// Respect bank settings, and roll back a return which cannot reimburse actual cash.
await db.exec('RESET ROLE');
await q('UPDATE fin_contas_bancarias SET saldo_atual=100,permite_negativo=false WHERE id=$1',[ids.conta]);
await db.exec('SET ROLE authenticated');
await mustFail('refund insufficient balance','SELECT devolver_venda_lote($1,$2,$3,$4)',[secondSale,'Sem saldo para reembolsar agora',today,randomUUID()]);
equal(await bank(),100,'insufficient balance leaves bank');
equal(Number(await scalar('SELECT count(*) FROM fin_transacoes')),countBefore,'insufficient balance leaves ledger');
await db.exec('RESET ROLE');
await q('UPDATE fin_contas_bancarias SET saldo_atual=$1,permite_negativo=true WHERE id=$2',[paidBefore,ids.conta]);
await db.exec('SET ROLE authenticated');
// Legacy discounts/interest must not be silently refunded as real cash.
await db.exec('RESET ROLE');
await db.exec('BEGIN');
await q('SELECT drivecar_private.lote_open($1)',[lote]);
await q('SELECT public.baixar_titulo($1,0,$2,$3,now(),10,0)',[secondTitleIds[0].id,ids.conta,ids.forma]);
await q('SELECT drivecar_private.lote_close($1)',[lote]);
await db.exec('COMMIT');
await db.exec('SET ROLE authenticated');
await mustFail('legacy adjustment refund','SELECT devolver_venda_lote($1,$2,$3,$4)',[secondSale,'Ajuste precisa conferência específica',today,randomUUID()]);
equal(await bank(),paidBefore,'legacy adjustment refund leaves bank');
// Closed lots reject new financial operations.
await db.exec('RESET ROLE');
await q('UPDATE est_lotes SET encerrado=true WHERE id=$1',[lote]);
await db.exec('SET ROLE authenticated');
await mustFail('closed lot reversal','SELECT estornar_baixa_lote($1,$2,$3,$4)',[paidTx,'Lote encerrado bloqueia',today,randomUUID()]);
await mustFail('closed lot refund','SELECT devolver_venda_lote($1,$2,$3,$4)',[secondSale,'Lote encerrado bloqueia',today,randomUUID()]);
await db.exec('RESET ROLE');
await q('UPDATE est_lotes SET encerrado=false WHERE id=$1',[lote]);
await db.exec('SET ROLE authenticated');
console.log('PASS financial rollback, legacy adjustment denial and closed-lot guards');
// Authenticated caller cannot forge histories, and foreign organizations cannot mutate.
await mustFail('forge history',"DELETE FROM est_lote_historico WHERE lote_id=$1",[lote]);
await q("SELECT set_config('request.jwt.claim.sub',$1,false)",[randomUUID()]);
await mustFail('foreign organization refund','SELECT devolver_venda_lote($1,$2,$3,$4)',[sale,'Sem acesso a esta venda',today,randomUUID()]);
await mustFail('foreign organization correction','SELECT cancelar_despesa_lote($1,$2,$3)',[expense,'Sem acesso a esta despesa',randomUUID()]);
equal(Number(await scalar('SELECT count(*) FROM est_lote_historico')),0,'history RLS');
await db.exec('RESET ROLE; SET ROLE anon');
await mustFail('anon correction','SELECT cancelar_despesa_lote($1,$2,$3)',[expense,'Acesso anônimo bloqueado',randomUUID()]);
await mustFail('anon reversal','SELECT estornar_baixa_lote($1,$2,$3,$4)',[paidTx,'Acesso anônimo bloqueado',today,randomUUID()]);
await db.exec('RESET ROLE');
console.log('PASS org isolation, restricted history, anonymous denial');
await db.close();
console.log('PASS all correction/refund SQL regressions');
