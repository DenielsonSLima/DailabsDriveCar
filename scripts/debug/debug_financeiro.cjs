const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFinanceiro() {
    console.log("--- DETAILED FINANCEIRO CHECK ---");

    // 1. Saldos Bancários
    const { data: contas, error: errContas } = await supabase
        .from('fin_contas_bancarias')
        .select('*');

    if (errContas) console.error("Error fetching bank accounts:", errContas);
    console.log(`\n1. Contas Bancárias (${contas?.length || 0}):`);
    let saldoDisponivel = 0;
    (contas || []).forEach(c => {
        console.log(`   - ${c.banco_nome} (${c.banco_cod || 'N/A'}): ${c.saldo_atual}`);
        saldoDisponivel += (c.saldo_atual || 0);
    });
    console.log(`   TOTAL Saldo Disponível: ${saldoDisponivel}`);

    // 2. Ativos (Estoque)
    const { data: veiculos, error: errVeiculos } = await supabase
        .from('est_veiculos')
        .select('id, placa, valor_custo, valor_custo_servicos, status')
        .in('status', ['DISPONIVEL', 'PREPARACAO', 'RESERVADO']);

    if (errVeiculos) console.error("Error fetching vehicles:", errVeiculos);
    console.log(`\n2. Veículos em Estoque (${veiculos?.length || 0}):`);
    let totalAtivos = 0;
    (veiculos || []).forEach(v => {
        const total = (v.valor_custo || 0) + (v.valor_custo_servicos || 0);
        console.log(`   - [${v.placa}] Status: ${v.status} | Custo: ${v.valor_custo} + Serv: ${v.valor_custo_servicos} = ${total}`);
        totalAtivos += total;
    });
    console.log(`   TOTAL Ativos (Estoque): ${totalAtivos}`);

    // 3. Contas a Receber
    const { data: receber, error: errReceber } = await supabase
        .from('fin_titulos')
        .select('valor_total, valor_pago, descricao, status')
        .eq('tipo', 'RECEBER');

    if (errReceber) console.error("Error fetching receivables:", errReceber);

    // Filter locally to match service logic exactly and see what's excluded
    const receberAberto = (receber || []).filter(t => t.status !== 'PAGO' && t.status !== 'CANCELADO');
    console.log(`\n3. Contas a Receber (Total: ${receber?.length}, Aberto: ${receberAberto.length}):`);

    let totalRecebivel = 0;
    receberAberto.forEach(t => {
        const saldo = t.valor_total - (t.valor_pago || 0);
        console.log(`   - ${t.descricao} (${t.status}): Total ${t.valor_total} - Pago ${t.valor_pago} = ${saldo}`);
        totalRecebivel += saldo;
    });
    console.log(`   TOTAL Recebível: ${totalRecebivel}`);

    // 4. Contas a Pagar
    const { data: pagar, error: errPagar } = await supabase
        .from('fin_titulos')
        .select('valor_total, valor_pago, descricao, status')
        .eq('tipo', 'PAGAR');

    if (errPagar) console.error("Error fetching payables:", errPagar);

    const pagarAberto = (pagar || []).filter(t => t.status !== 'PAGO' && t.status !== 'CANCELADO');
    console.log(`\n4. Contas a Pagar (Total: ${pagar?.length}, Aberto: ${pagarAberto.length}):`);

    let totalPassivo = 0;
    pagarAberto.forEach(t => {
        const saldo = t.valor_total - (t.valor_pago || 0);
        console.log(`   - ${t.descricao} (${t.status}): Total ${t.valor_total} - Pago ${t.valor_pago} = ${saldo}`);
        totalPassivo += saldo;
    });
    console.log(`   TOTAL Passivo: ${totalPassivo}`);

    // Calculation
    console.log("\n--- RESULTADO FINAL ---");
    console.log(`(+) Saldo Disponível: ${saldoDisponivel}`);
    console.log(`(+) Ativos (Estoque): ${totalAtivos}`);
    console.log(`(+) Contas a Receber: ${totalRecebivel}`);
    console.log(`(-) Contas a Pagar:   ${totalPassivo}`);

    const patrimonioLiquido = (saldoDisponivel + totalAtivos + totalRecebivel) - totalPassivo;
    console.log(`(=) PATRIMÔNIO LÍQUIDO: ${patrimonioLiquido}`);
}

checkFinanceiro();
