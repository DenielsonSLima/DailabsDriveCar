/** Isolated PostgreSQL/WASM test. Synthetic rows only, no remote connection.
 * PGLITE_MODULE_PATH=/tmp/drivecar-motos-runtime/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-receivables-lotes-sql.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const db = new PGlite();
const q = async (sql, args = []) => (await db.query(sql, args)).rows;
try {
  await db.exec(`
    CREATE ROLE authenticated; CREATE ROLE anon;
    CREATE FUNCTION public.get_my_org_id() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT NULLIF(current_setting('test.org_id', true), '')::uuid $$;
    CREATE TABLE public.fin_titulos (
      id text PRIMARY KEY, organization_id uuid, lote_id text, tipo text, status text,
      valor_total numeric, valor_pago numeric, valor_desconto numeric, origem_tipo text
    );
    -- Mesma forma e permissões da RPC preexistente; CREATE OR REPLACE deve conservá-las.
    CREATE FUNCTION public.rpc_kpi_contas_receber() RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS
      $$ BEGIN RETURN '{}'::json; END $$;
    GRANT EXECUTE ON FUNCTION public.rpc_kpi_contas_receber() TO authenticated, anon;
  `);
  const migration = readFileSync(new URL('../supabase/migrations/20261111180509_separar_recebiveis_lotes.sql', import.meta.url), 'utf8');
  const aclBefore = await q("SELECT proacl, prosecdef FROM pg_proc WHERE oid = 'public.rpc_kpi_contas_receber()'::regprocedure");
  const org = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
  const rows = [
    ['normal', org, null, 'RECEBER', 'PENDENTE', 100, 0, 0, 'PEDIDO_VENDA'],
    ['partial', org, null, 'RECEBER', 'PARCIAL', 200, 60, 10, 'PEDIDO_VENDA'],
    ['late', org, null, 'RECEBER', 'ATRASADO', 300, null, null, null],
    ['legacy', org, null, 'RECEBER', 'ABERTO', 400, 0, 0, 'MANUAL'],
    ['paid', org, null, 'RECEBER', 'PAGO', 500, 500, 0, 'PEDIDO_VENDA'],
    ['cancelled', org, null, 'RECEBER', 'CANCELADO', 600, 0, 0, 'PEDIDO_VENDA'],
    ['credit', org, null, 'RECEBER', 'PARCIAL', 700, 50, 0, 'OUTRO_CREDITO'],
    ['payable', org, null, 'PAGAR', 'PENDENTE', 800, 0, 0, 'PEDIDO_COMPRA'],
    ['other-company', other, null, 'RECEBER', 'PENDENTE', 900, 0, 0, 'PEDIDO_VENDA'],
  ];
  // Clones em lote: mesmos estados, fórmulas, origem e empresas, valores diferentes.
  rows.push(...rows.map(row => ['lote-' + row[0], row[1], 'batch', ...row.slice(3, 5), Number(row[5]) * 10, row[6], row[7], row[8]]));
  for (const row of rows) await q('INSERT INTO public.fin_titulos VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', row);
  const original = await q('SELECT * FROM public.fin_titulos ORDER BY id');
  await db.exec(migration);
  assert.deepEqual(await q("SELECT proacl, prosecdef FROM pg_proc WHERE oid = 'public.rpc_kpi_contas_receber()'::regprocedure"), aclBefore);
  await q("SELECT set_config('test.org_id', $1, false)", [org]);
  await db.exec('SET ROLE authenticated');
  const kpis = () => q('SELECT public.rpc_kpi_contas_receber() AS kpis').then(rows => rows[0].kpis);
  assert.deepEqual(await kpis(), { valor_total: 1000, total_recebido: 60, total_em_aberto: 930 });
  await q("SELECT set_config('test.org_id', $1, false)", [other]);
  assert.deepEqual(await kpis(), { valor_total: 900, total_recebido: 0, total_em_aberto: 900 });
  for (const empty of ['', '33333333-3333-4333-8333-333333333333']) {
    await q("SELECT set_config('test.org_id', $1, false)", [empty]);
    assert.deepEqual(await kpis(), { valor_total: 0, total_recebido: 0, total_em_aberto: 0 });
  }
  await db.exec('RESET ROLE');
  assert.deepEqual(await q('SELECT * FROM public.fin_titulos ORDER BY id'), original, 'Migration e consultas não alteram os títulos');
  assert.equal((await q("SELECT count(*)::int n FROM public.fin_titulos WHERE lote_id='batch'"))[0].n, 9);
  // Idempotência de schema: reaplicar não muda dados nem resultado.
  await db.exec(migration);
  await q("SELECT set_config('test.org_id', $1, false)", [org]);
  assert.deepEqual(await kpis(), { valor_total: 1000, total_recebido: 60, total_em_aberto: 930 });
  console.log('PASS: RPC exclui somente lotes; preserva fórmula, descontos, nulos, estados, empresa, permissões e todos os registros.');
} finally { await db.close(); }
