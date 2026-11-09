/**
 * Offline stock-composition regression tests. Uses synthetic data in an ephemeral
 * PostgreSQL/WASM database only; never connects to a remote database.
 * PGLITE_MODULE_PATH=/tmp/drivecar-motos-runtime/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-caixa-estoque-sql.mjs
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const db = new PGlite();
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
try {
  await db.exec(read('./fixtures/lotes-schema.sql'));
  const previous = read('../supabase/migrations/20261024163146_lotes_veiculos_custos_vendas.sql');
  await db.exec(previous);
  await db.exec(read('../supabase/migrations/20261024163638_index_lotes_foreign_keys.sql'));
  await db.exec(read('../supabase/migrations/20261109181558_ajustar_quantidade_lote.sql'));
  // Keep an exact independent copy of the prior RPC for same-fixture comparison.
  const oldFunction = previous.match(/CREATE OR REPLACE FUNCTION public\.get_caixa_metrics\([\s\S]*?\$function\$;/)?.[0];
  assert.ok(oldFunction, 'prior function definition must exist');
  await db.exec(oldFunction.replace('public.get_caixa_metrics(', 'public.test_previous_caixa_metrics('));
  await db.exec(read('../supabase/migrations/20261109190949_separar_ativos_estoque_lotes.sql'));
  await db.exec("SET TimeZone = 'America/Maceio'");
  const columns = await q(`SELECT table_name,column_name,data_type,is_nullable,column_default,is_generated
    FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`);
  const tables = {};
  for (const column of columns) (tables[column.table_name] ||= []).push(column);
  async function seed(table, values) {
    const vals = {};
    for (const c of tables[table]) {
      if (c.is_nullable === 'NO' && !c.column_default && c.is_generated !== 'ALWAYS' && !(c.column_name in values)) {
        vals[c.column_name] = c.data_type === 'uuid' ? randomUUID()
          : ['integer', 'numeric', 'bigint', 'smallint'].includes(c.data_type) ? 1
          : c.data_type === 'boolean' ? true
          : c.data_type.includes('timestamp') ? '2020-01-01T12:00:00Z'
          : c.data_type === 'date' ? '2020-01-01' : c.data_type === 'jsonb' ? '{}' : 'fixture';
      }
    }
    Object.assign(vals, values);
    const keys = Object.keys(vals);
    await q(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map((_, i) => '$' + (i + 1)).join(',')})`, Object.values(vals));
  }
  const org = randomUUID(), other = randomUUID(), user = randomUUID(), otherUser = randomUUID();
  for (const id of [org, other]) await seed('organizations', { id });
  await seed('organization_members', { organization_id: org, user_id: user });
  await seed('organization_members', { organization_id: other, user_id: otherUser });
  await q("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
  const types = {};
  for (const name of ['MOTOCICLETA', ' moto ', 'MOTONETA', 'CICLOMOTOR', 'AUTOMOVEL', 'INDEFINIDO']) {
    types[name] = randomUUID();
    await seed('cad_tipos_veiculos', { id: types[name], nome: name, organization_id: org, user_id: user });
  }
  async function vehicle(overrides = {}) {
    const id = randomUUID();
    await seed('est_veiculos', { id, organization_id: org, status: 'DISPONIVEL',
      valor_custo: 1000, valor_custo_servicos: 10, created_at: '2020-01-01T12:00:00Z', ...overrides });
    return id;
  }
  const individuals = [];
  for (let i = 0; i < 18; i++) individuals.push(await vehicle());
  const purchase = randomUUID();
  await seed('cmp_pedidos', { id: purchase, organization_id: org, status: 'CONCLUIDO', valor_negociado: 40000 });
  const origin = await vehicle({ pedido_id: purchase, valor_custo: 40000, valor_custo_servicos: 0, tipo_veiculo_id: types.MOTOCICLETA });
  const lot = (await q('SELECT public.criar_lote($1,40,$2) id', [origin, 'Synthetic motorcycle lot']))[0].id;
  const units = (await q('SELECT id FROM est_veiculos WHERE lote_id=$1 ORDER BY lote_ordem', [lot])).map(x => x.id);
  const newKeys = ['qtd_veiculos_individuais', 'qtd_unidades_lotes', 'qtd_motos_lotes'];
  async function check(label, expected, end = '2020-01-31', identity = user) {
    await q("SELECT set_config('request.jwt.claim.sub',$1,false)", [identity]);
    await db.exec('SET ROLE authenticated');
    let row;
    try {
      [row] = await q('SELECT get_caixa_metrics($1::date,$2::date) current, test_previous_caixa_metrics($1::date,$2::date) previous', ['2020-01-01', end]);
    } finally { await db.exec('RESET ROLE'); }
    const legacy = { ...row.current };
    for (const key of newKeys) delete legacy[key];
    assert.deepEqual(legacy, row.previous, `${label}: all pre-existing metrics must remain unchanged`);
    for (const [key, value] of Object.entries(expected)) assert.equal(row.current[key], value, `${label}: ${key}`);
    if (Object.keys(row.current).length) {
      assert.equal(row.current.qtd_veiculos_individuais + row.current.qtd_unidades_lotes, row.current.qtd_veiculos_estoque, `${label}: partition`);
      assert.ok(row.current.qtd_motos_lotes <= row.current.qtd_unidades_lotes, `${label}: motorcycle subset`);
    }
    console.log('PASS', label);
    return row.current;
  }
  await check('18 individual vehicles plus 40 motorcycles, unchanged financial metrics', {
    qtd_veiculos_individuais: 18, qtd_unidades_lotes: 40, qtd_motos_lotes: 40,
    qtd_veiculos_estoque: 58, total_ativos_estoque: 58180,
  });
  // Owner-only synthetic fixture mutations use the existing private guard context.
  // The application-facing reads above still execute as authenticated with RLS.
  async function mutateLot(callback) {
    await db.exec('BEGIN');
    try {
      await q('SELECT drivecar_private.lote_open($1)', [lot]);
      await callback();
      await q('SELECT drivecar_private.lote_close($1)', [lot]);
      await db.exec('COMMIT');
    } catch (error) { await db.exec('ROLLBACK'); throw error; }
  }
  await mutateLot(async () => {
    for (let i = 0; i < 3; i++) await q('UPDATE est_veiculos SET tipo_veiculo_id=$1 WHERE id=$2', [types[[' moto ', 'MOTONETA', 'CICLOMOTOR'][i]], units[i]]);
    await q("UPDATE est_veiculos SET status='PREPARACAO' WHERE id=$1", [units[0]]);
  });
  await q("UPDATE est_veiculos SET status='RESERVADO' WHERE id=$1", [individuals[0]]);
  await q("UPDATE est_veiculos SET status='PREPARACAO' WHERE id=$1", [individuals[1]]);
  await check('normalized motorcycle types and reserved/preparation stock', { qtd_veiculos_estoque: 58, qtd_motos_lotes: 40, total_ativos_estoque: 58180 });
  await mutateLot(async () => {
    await q('UPDATE est_veiculos SET tipo_veiculo_id=$1 WHERE id=$2', [types.AUTOMOVEL, units[3]]);
    await q('UPDATE est_veiculos SET tipo_veiculo_id=NULL WHERE id=$1', [units[4]]);
    await q('UPDATE est_veiculos SET tipo_veiculo_id=$1 WHERE id=$2', [types.INDEFINIDO, units[5]]);
  });
  await check('mixed lot with automobile, missing and unknown type', { qtd_veiculos_estoque: 58, qtd_unidades_lotes: 40, qtd_motos_lotes: 37, total_ativos_estoque: 58180 });
  for (const [index, date, status] of [[2, '2020-01-15', 'CONCLUIDO'], [3, '2020-02-01', 'CONCLUIDO'], [4, '2020-01-15', 'CANCELADO']]) {
    await seed('venda_pedidos', { organization_id: org, veiculo_id: individuals[index], data_venda: date, status, valor_venda: 2000 });
  }
  await mutateLot(async () => {
    for (const [index, date, status] of [[6, '2020-01-15', 'CONCLUIDO'], [7, '2020-02-01', 'CONCLUIDO'], [8, '2020-01-15', 'CANCELADO']]) {
      const id = randomUUID();
      await seed('venda_pedidos', { id, organization_id: org, veiculo_id: units[index], lote_id: lot, quantidade_lote: 1, data_venda: date, status, valor_venda: 2000 });
      await seed('venda_lote_itens', { venda_id: id, veiculo_id: units[index], lote_id: lot, organization_id: org, custo_na_venda: 1000, valor_venda: 2000, status_anterior: 'DISPONIVEL' });
    }
  });
  await vehicle({ created_at: '2020-02-01T00:00:00-03:00' });
  await vehicle({ organization_id: other, valor_custo: 999999 });
  await check('historical cutoff: completed before/after, canceled, later creation and foreign tenant', {
    qtd_veiculos_individuais: 17, qtd_unidades_lotes: 39, qtd_motos_lotes: 36,
    qtd_veiculos_estoque: 56, total_ativos_estoque: 56170,
  });
  await check('later cutoff includes new vehicle and excludes later completed sales', {
    qtd_veiculos_individuais: 17, qtd_unidades_lotes: 38, qtd_motos_lotes: 35,
    qtd_veiculos_estoque: 55, total_ativos_estoque: 55170,
  }, '2020-02-28');
  await mutateLot(async () => {
    const sale = (await q("SELECT id FROM venda_pedidos WHERE lote_id=$1 AND data_venda='2020-01-15' AND status='CONCLUIDO'", [lot]))[0].id;
    await q('UPDATE venda_pedidos SET quantidade_lote=2 WHERE id=$1', [sale]);
    await seed('venda_lote_itens', { venda_id: sale, veiculo_id: units[9], lote_id: lot,
      organization_id: org, custo_na_venda: 1000, valor_venda: 2000, status_anterior: 'DISPONIVEL' });
  });
  await check('non-primary lot unit is excluded through venda_lote_itens', {
    qtd_veiculos_individuais: 17, qtd_unidades_lotes: 38, qtd_motos_lotes: 35,
    qtd_veiculos_estoque: 55, total_ativos_estoque: 55170,
  });
  await check('other organization only sees its own stock', {
    qtd_veiculos_individuais: 1, qtd_unidades_lotes: 0, qtd_motos_lotes: 0,
    qtd_veiculos_estoque: 1, total_ativos_estoque: 1000009,
  }, '2020-01-31', otherUser);
  assert.deepEqual(await check('authenticated user without membership', {}, '2020-01-31', randomUUID()), {});
  assert.deepEqual(await check('missing authentication', {}, '2020-01-31', ''), {});
  console.log('PASS all stock composition SQL regressions');
} catch (error) {
  console.error('SQL regression failed:', error.message, error.detail || '', error.where || '');
  process.exitCode = 1;
} finally {
  await db.close();
}
