import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('--- FETCHING REAL BANK ACCOUNTS FOR HIDROCAR ---');
  // Hidrocar organization ID: c716f982-d3ac-476a-8981-90948dc4ae9b
  const { data: contas, error: errC } = await supabase
    .from('fin_contas_bancarias')
    .select('*')
    .eq('organization_id', 'c716f982-d3ac-476a-8981-90948dc4ae9b');

  if (errC) {
    console.error('Error fetching accounts:', errC);
    return;
  }
  
  console.log('Active bank accounts found:', contas.map(c => ({ id: c.id, banco: c.banco_nome, titular: c.titular })));

  if (contas.length === 0) {
    console.log('No bank accounts.');
    return;
  }

  const contaId = contas[0].id; // Test with first account
  const dataInicio = '2026-03-02';
  const dataFim = '2026-06-09';

  console.log(`\nTesting getExtratoPorConta step-by-step for account ${contaId} from ${dataInicio} to ${dataFim}:`);

  try {
    console.log('Step 1: Fetching account initial balance...');
    const { data: conta, error: errC2 } = await supabase
      .from('fin_contas_bancarias')
      .select('saldo_inicial')
      .eq('id', contaId)
      .single();

    if (errC2) throw errC2;
    console.log('Step 1 OK. Initial balance:', conta?.saldo_inicial);
    let saldo = Number(conta?.saldo_inicial || 0);

    console.log('Step 2: Fetching past transactions before dataInicio...');
    const { data: pastTx, error: errP } = await supabase
      .from('fin_transacoes')
      .select('valor, tipo')
      .eq('conta_origem_id', contaId)
      .lt('data_pagamento', dataInicio);

    if (errP) throw errP;
    console.log('Step 2 OK. Past transactions count:', pastTx?.length || 0);

    if (pastTx) {
      saldo += pastTx.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
      saldo -= pastTx.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    }
    const saldoAnterior = saldo;
    console.log('Calculated Saldo Anterior:', saldoAnterior);

    console.log('Step 3: Fetching current transactions in period...');
    const { data: currentTx, error: errCur } = await supabase
      .from('fin_transacoes')
      .select(`
        id, valor, data_pagamento, tipo, tipo_transacao, descricao,
        titulo:fin_titulos(descricao, status, parceiro:parceiros(nome)),
        forma_pagamento:cad_formas_pagamento(nome)
      `)
      .eq('conta_origem_id', contaId)
      .neq('tipo_transacao', 'ESTORNO')
      .gte('data_pagamento', dataInicio)
      .lte('data_pagamento', dataFim + 'T23:59:59')
      .order('data_pagamento', { ascending: true });

    if (errCur) throw errCur;
    console.log('Step 3 OK. Current transactions count:', currentTx?.length || 0);

    const filteredTx = (currentTx || []).filter((t) => !t.titulo || t.titulo.status !== 'CANCELADO');
    console.log('Filtered transactions (excluding cancelled):', filteredTx.length);

    let saldoFINAL = saldoAnterior;
    if (filteredTx) {
      saldoFINAL += filteredTx.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
      saldoFINAL -= filteredTx.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    }
    console.log('Calculated Saldo Final:', saldoFINAL);

  } catch (err) {
    console.error('CRASH IN OPERATION:', err.message || err);
  }
}

main().catch(console.error);
