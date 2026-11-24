/**
 * Isolated PostgreSQL/WASM test; all records are synthetic.
 * PGLITE_MODULE_PATH=/tmp/drivecar-stock-test/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-entrada-lote-sql.mjs
 * Optional PURCHASE_CONFIRM_FIXTURE_PATH points to the installed regular purchase
 * RPC's schema-only definition for a more faithful integration run.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const { PGlite } = await import(process.env.PGLITE_MODULE_PATH || '@electric-sql/pglite');
const db = new PGlite();
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const orgId = randomUUID(), otherOrg = randomUUID(), user = randomUUID();
const sampleCost = 725.11;

try {
  await db.exec(read('./fixtures/lotes-schema.sql'));
  await db.exec(read('../supabase/migrations/20261024163146_lotes_veiculos_custos_vendas.sql'));
  await db.exec(read('../supabase/migrations/20261024163638_index_lotes_foreign_keys.sql'));
  await db.exec(read('../supabase/migrations/20261109181558_ajustar_quantidade_lote.sql'));

  await db.exec(`
    CREATE TABLE public.cmp_pedidos_pagamentos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      pedido_id uuid NOT NULL REFERENCES public.cmp_pedidos(id),
      valor numeric NOT NULL,
      data_pagamento date NOT NULL DEFAULT current_date,
      forma_pagamento_id uuid,
      conta_bancaria_id uuid
    );
    ALTER TABLE public.cmp_pedidos_pagamentos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY compra_pagamento_fixture ON public.cmp_pedidos_pagamentos
      FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.cmp_pedidos p WHERE p.id = pedido_id)
      );
    GRANT SELECT ON public.cmp_pedidos_pagamentos TO authenticated;
  `);
  if (process.env.PURCHASE_CONFIRM_FIXTURE_PATH) {
    await db.exec(readFileSync(process.env.PURCHASE_CONFIRM_FIXTURE_PATH, 'utf8'));
  } else {
    // Emulate the old RPC's relevant contract, including an actual finance write
    // before later conversion, so the rollback assertion cannot pass trivially.
    await db.exec(`
      CREATE FUNCTION public.confirmar_pedido_compra(p_pedido_id uuid) RETURNS jsonb
      LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
      DECLARE p public.cmp_pedidos%ROWTYPE;
      BEGIN
        SELECT * INTO STRICT p FROM public.cmp_pedidos WHERE id = p_pedido_id FOR UPDATE;
        IF p.status = 'CONCLUIDO' THEN RAISE EXCEPTION 'Este pedido já está concluído'; END IF;
        INSERT INTO public.fin_titulos(organization_id, pedido_id, origem_id, origem_tipo,
          tipo, status, valor_total, data_vencimento, descricao)
          SELECT p.organization_id, p.id, pg.id, 'PEDIDO_COMPRA', 'PAGAR', 'PENDENTE',
            pg.valor, pg.data_pagamento, 'Pagamento de teste'
          FROM public.cmp_pedidos_pagamentos pg WHERE pg.pedido_id = p.id;
        UPDATE public.cmp_pedidos SET status='CONCLUIDO' WHERE id=p.id;
        UPDATE public.est_veiculos SET status='DISPONIVEL' WHERE pedido_id=p.id;
        RETURN '[]'::jsonb;
      END;
      $$;
    `);
  }
  const fs = await import('node:fs');
  const migrationPath = new URL('../supabase/migrations/', import.meta.url);
  const matching = fs.readdirSync(migrationPath).filter(x => x.endsWith('_confirmar_entrada_em_lote.sql'));
  assert.equal(matching.length, 1);
  await db.exec(readFileSync(new URL(matching[0], migrationPath), 'utf8'));
  await q("SELECT set_config('request.jwt.claim.sub', $1, false)", [user]);
  for (const id of [orgId, otherOrg])
    await q("INSERT INTO public.organizations(id,name) VALUES($1,'Organização fictícia')", [id]);
  await q("INSERT INTO public.organization_members(organization_id,user_id) VALUES($1,$2)", [orgId, user]);
  const normalForm = randomUUID(), consignedForm = randomUUID();
  for (const [id, nome] of [[normalForm, 'Transferência'], [consignedForm, 'Consignação']])
    await q("INSERT INTO public.cad_formas_pagamento(id,organization_id,nome,tipo_movimentacao,destino_lancamento) VALUES($1,$2,$3,'AMBOS','CAIXA')", [id, orgId, nome]);

  let counter = 0;
  async function seed({ org = orgId, units = 1, form = normalForm, extraCost = 0, status = 'RASCUNHO', linkedBank = false } = {}) {
    const id = randomUUID();
    await q(`INSERT INTO public.cmp_pedidos(id,numero_pedido,user_id,organization_id,status,valor_negociado,forma_pagamento_id)
      VALUES($1,$2,$3,$4,$5,$6,$7)`, [id, ++counter, user, org, status, sampleCost, form]);
    for (let i = 0; i < units; i++) {
      await q(`INSERT INTO public.est_veiculos(pedido_id,organization_id,status,valor_custo,valor_custo_servicos,is_consignado)
        VALUES($1,$2,$3,$4,$5,false)`, [id, org, 'PREPARACAO', sampleCost, extraCost]);
    }
    const conta = linkedBank ? randomUUID() : null;
    if (conta) await q(`INSERT INTO public.fin_contas_bancarias(id,organization_id,banco_nome,titular,saldo_atual,ativo)
      VALUES($1,$2,'Banco fictício','Titular fictício',50000,true)`, [conta, org]);
    await q(`INSERT INTO public.cmp_pedidos_pagamentos(pedido_id,valor,forma_pagamento_id,conta_bancaria_id)
      VALUES($1,$2,$3,$4)`, [id, sampleCost, form, conta]);
    return id;
  }

  const isRealConfirmation = Boolean(process.env.PURCHASE_CONFIRM_FIXTURE_PATH);
  const first = await seed({ linkedBank: isRealConfirmation }), second = await seed(), regular = await seed(), foreign = await seed({org: otherOrg});
  const multiple = await seed({ units: 2 }), empty = await seed({ units: 0 }), consigned = await seed({ form: consignedForm });
  const badCost = await seed({ extraCost: 1, linkedBank: isRealConfirmation });
  const confirm = async (id, qty, desc) => (await q(
    'SELECT public.confirmar_pedido_compra_em_lote($1,$2,$3) AS id', [id, qty, desc]
  ))[0].id;
  const titles = id => q(`SELECT id,lote_id,valor_total FROM public.fin_titulos
    WHERE pedido_id=$1 AND origem_tipo='PEDIDO_COMPRA' ORDER BY id`, [id]);
  const state = id => q(`SELECT status,
    (SELECT count(*)::int FROM public.est_lotes WHERE pedido_id = p.id) AS batches,
    (SELECT count(*)::int FROM public.est_veiculos WHERE pedido_id = p.id AND status = 'DISPONIVEL') AS available
    FROM public.cmp_pedidos p WHERE id=$1`, [id]);
  const transactions = async id => (await q(`SELECT count(*)::int AS count
    FROM public.fin_transacoes tr JOIN public.fin_titulos t ON t.id = tr.titulo_id WHERE t.pedido_id=$1`, [id]))[0].count;

  await db.exec('SET ROLE anon');
  await assert.rejects(confirm(first, 3, 'Sem acesso'), /permission denied/);
  await db.exec('RESET ROLE');
  await db.exec('SET ROLE authenticated');
  await assert.rejects(confirm(foreign, 3, 'Compra alheia'), /acesso não autorizado/);
  for (const [qty, desc] of [[null, 'X'], [1, 'X'], [1001, 'X'], [3, ' \t '], [3, 'q'.repeat(201)]]) {
    await assert.rejects(confirm(first, qty, desc), /quantidade inteira|descrição do lote/);
  }
  await assert.rejects(confirm(empty, 3, 'Sem unidade'), /único veículo/);
  await assert.rejects(confirm(multiple, 3, 'Excesso de unidades'), /único veículo/);
  await assert.rejects(confirm(consigned, 3, 'Consignação'), /não está disponível para consignação/);
  assert.deepEqual((await state(first))[0], { status: 'RASCUNHO', batches: 0, available: 0 });
  assert.equal((await titles(first)).length, 0);

  const loteA = await confirm(first, 3, '  Lote A  ');
  const loteB = await confirm(second, 4, 'Lote B');
  assert.notEqual(loteA, loteB);
  assert.deepEqual((await state(first))[0], { status: 'CONCLUIDO', batches: 1, available: 3 });
  assert.deepEqual((await state(second))[0], { status: 'CONCLUIDO', batches: 1, available: 4 });
  for (const [id, lot, expectedQty] of [[first, loteA, 3], [second, loteB, 4]]) {
    const units = await q('SELECT count(*)::int n,sum(valor_custo)::float8 cost FROM public.est_veiculos WHERE lote_id=$1', [lot]);
    assert.deepEqual(units[0], {n: expectedQty, cost: sampleCost});
    const rows = await titles(id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].lote_id, lot);
    assert.equal(Number(rows[0].valor_total), sampleCost);
  }
  const priorTitles = await titles(first);
  assert.equal(await confirm(first, 3, 'Lote A'), loteA);
  if (isRealConfirmation) assert.equal(await transactions(first), 1);
  await assert.rejects(confirm(first, 4, 'Lote A'), /outros dados/);
  assert.deepEqual(await titles(first), priorTitles);
  assert.deepEqual((await state(first))[0], { status: 'CONCLUIDO', batches: 1, available: 3 });

  // If the second half fails after financial mutations, no state is retained.
  await assert.rejects(confirm(badCost, 3, 'Deve reverter'), /exige custo positivo e ausência de vendas ou despesas/);
  assert.deepEqual((await state(badCost))[0], { status: 'RASCUNHO', batches: 0, available: 0 });
  assert.equal((await titles(badCost)).length, 0);
  assert.equal(await transactions(badCost), 0);

  await q('SELECT public.confirmar_pedido_compra($1)', [regular]);
  await assert.rejects(confirm(regular, 3, 'Confirmado sem lote'), /já foi confirmada sem lote/);
  assert.deepEqual((await state(regular))[0], { status: 'CONCLUIDO', batches: 0, available: 1 });
  assert.equal((await titles(regular)).length, 1);
  const cards = (await q('SELECT public.listar_lotes() AS lots'))[0].lots;
  assert.deepEqual(cards.map(x => [x.id, x.descricao, x.quantidade_inicial]).sort(),
    [[loteA, 'Lote A', 3], [loteB, 'Lote B', 4]].sort());
  console.log('PASS two separate purchase lots/cards, preserved regular purchase, repeat-safe accounting, atomic rollback, and access control');
} catch (error) {
  console.error('Falha nos testes de entrada em lote:', error.message, error.detail || '', error.where || '');
  process.exitCode = 1;
} finally {
  await db.close();
}
