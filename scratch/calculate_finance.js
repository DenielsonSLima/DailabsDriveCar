import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbWhsbHRtZ3d4bGlia2x5cnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTgzNSwiZXhwIjoyMDg0NDg1ODM1fQ.TRhHESMAGYnQ0JBZRoEPVFMbGvP2F1OuZj7AyrQ5XUw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function runForOrg(org) {
  const orgId = org.id;
  const orgName = org.name;
  console.log(`\n======================================================================`);
  console.log(`RUNNING FINANCIAL ANALYSIS FOR: ${orgName} (${orgId})`);
  console.log(`======================================================================`);

  const dataInicio = '2026-06-01';
  const dataFim = '2026-06-30';
  const dataFimLimit = '2026-07-01T00:00:00Z';

  // 1. Fetch all transactions in June 2026 for this organization based on data_pagamento
  // We filter transactions by joining with fin_titulos and checking organization_id
  const { data: transacoes, error: transError } = await supabase
    .from('fin_transacoes')
    .select(`
      id,
      data_pagamento,
      valor,
      tipo,
      tipo_transacao,
      descricao,
      conta_origem_id,
      titulo:fin_titulos!inner(
        id,
        origem_tipo,
        tipo,
        status,
        organization_id,
        categoria:fin_categorias(nome),
        parceiro:parceiros(nome)
      )
    `)
    .eq('titulo.organization_id', orgId)
    .gte('data_pagamento', `${dataInicio}T00:00:00Z`)
    .lte('data_pagamento', `${dataFim}T23:59:59.999Z`)
    .order('data_pagamento', { ascending: true });

  if (transError) {
    console.error(`Error fetching transactions for ${orgName}:`, transError);
    return;
  }

  console.log(`Total transactions found: ${transacoes.length}`);

  let totalEntradas = 0;
  let totalSaidas = 0;
  let despesasFixas = 0;
  let despesasVariaveis = 0;
  let outrosDebitos = 0;
  let outrosCreditos = 0;
  let descontosObtidos = 0;
  let descontosConcedidos = 0;

  console.log('\n--- TRANSACTION DETAILS ---');
  for (const t of transacoes) {
    const valorNum = Number(t.valor);
    const isDesconto = t.tipo_transacao === 'DESCONTO_TITULO';
    const isEstorno = t.tipo_transacao === 'ESTORNO';
    const origemTipo = t.titulo?.origem_tipo || '';
    const tituloTipo = t.titulo?.tipo || '';

    console.log(`- Data: ${t.data_pagamento.substring(0,10)} | ${t.tipo} | R$ ${valorNum.toFixed(2)} | Trans: ${t.tipo_transacao} | Origem: ${origemTipo} | Desc: ${t.descricao}`);

    if (isEstorno) continue;

    if (isDesconto) {
      if (tituloTipo === 'PAGAR') {
        descontosObtidos += valorNum;
      } else if (tituloTipo === 'RECEBER') {
        descontosConcedidos += valorNum;
      }
      continue;
    }

    if (origemTipo === 'TRANSFERENCIA') continue;

    if (t.tipo === 'ENTRADA') {
      totalEntradas += valorNum;
      if (origemTipo === 'OUTRO_CREDITO') {
        outrosCreditos += valorNum;
      }
    } else if (t.tipo === 'SAIDA') {
      totalSaidas += valorNum;
      if (['RECORRENTE', 'DESPESA', 'DESPESA_FIXA', 'FIXA'].includes(origemTipo)) {
        despesasFixas += valorNum;
      } else if (['DESPESA_VARIAVEL', 'DESPESA_VEICULO', 'VARIAVEL'].includes(origemTipo)) {
        despesasVariaveis += valorNum;
      } else if (origemTipo === 'OUTRO_DEBITO') {
        outrosDebitos += valorNum;
      }
    }
  }

  // 2. Fetch purchases and sales
  const { data: compras, error: comprasError } = await supabase
    .from('cmp_pedidos')
    .select('id, valor_negociado, created_at, status')
    .eq('organization_id', orgId)
    .eq('status', 'CONCLUIDO')
    .gte('created_at', `${dataInicio}T00:00:00Z`)
    .lte('created_at', `${dataFim}T23:59:59.999Z`);

  if (comprasError) console.error('Error fetching compras:', comprasError);
  const totalCompras = (compras || []).reduce((acc, c) => acc + Number(c.valor_negociado), 0);

  const { data: vendas, error: vendasError } = await supabase
    .from('venda_pedidos')
    .select(`
      id,
      valor_venda,
      data_venda,
      status,
      veiculo:est_veiculos(valor_custo, valor_custo_servicos)
    `)
    .eq('organization_id', orgId)
    .eq('status', 'CONCLUIDO')
    .gte('data_venda', dataInicio)
    .lte('data_venda', dataFim);

  if (vendasError) console.error('Error fetching vendas:', vendasError);

  let totalVendas = 0;
  let totalCustoVendas = 0;
  for (const v of (vendas || [])) {
    totalVendas += Number(v.valor_venda);
    if (v.veiculo) {
      totalCustoVendas += (Number(v.veiculo.valor_custo) || 0) + (Number(v.veiculo.valor_custo_servicos) || 0);
    }
  }

  // 3. Fetch manual titles
  const { data: titulosManuais, error: titulosManuaisError } = await supabase
    .from('fin_titulos')
    .select(`
      id,
      valor_total,
      data_vencimento,
      transacoes:fin_transacoes(valor, tipo, tipo_transacao)
    `)
    .eq('organization_id', orgId)
    .eq('origem_tipo', 'MANUAL')
    .not('status', 'eq', 'CANCELADO')
    .gte('data_vencimento', dataInicio)
    .lte('data_vencimento', dataFim);

  if (titulosManuaisError) console.error('Error fetching manual titles:', titulosManuaisError);

  let lucroAdicionais = 0;
  for (const tit of (titulosManuais || [])) {
    const valorTotal = Number(tit.valor_total);
    const emprestado = (tit.transacoes || [])
      .filter((tr) => tr.tipo_transacao === 'EMPRESTIMO_CONCEDIDO' && tr.tipo === 'SAIDA')
      .reduce((acc, tr) => acc + Number(tr.valor), 0);
    lucroAdicionais += (valorTotal - emprestado);
  }

  // 4. Balances and Inventory
  // A. Saldo Bancário Real (current balance)
  const { data: contas, error: contasError } = await supabase
    .from('fin_contas_bancarias')
    .select('*')
    .eq('organization_id', orgId)
    .eq('ativo', true);

  if (contasError) console.error('Error fetching accounts:', contasError);

  let saldoDisponivel = 0;
  for (const c of (contas || [])) {
    saldoDisponivel += Number(c.saldo_atual);
  }

  // B. Ativos em Estoque (Veículos em estoque em 30/06/2026)
  const { data: estoqueVeiculos, error: estError } = await supabase
    .from('est_veiculos')
    .select('id, valor_custo, valor_custo_servicos, placa, status')
    .eq('organization_id', orgId);

  if (estError) console.error('Error fetching estoque:', estError);

  let totalAtivosEstoque = 0;
  let qtdVeiculosEstoque = 0;
  for (const ev of (estoqueVeiculos || [])) {
    const { data: sale } = await supabase
      .from('venda_pedidos')
      .select('id')
      .eq('veiculo_id', ev.id)
      .eq('status', 'CONCLUIDO')
      .lte('data_venda', '2026-06-30')
      .limit(1);

    if (!sale || sale.length === 0) {
      totalAtivosEstoque += (Number(ev.valor_custo) || 0) + (Number(ev.valor_custo_servicos) || 0);
      qtdVeiculosEstoque++;
    }
  }

  // C. Contas a Receber
  const { data: titulosReceber, error: recError } = await supabase
    .from('fin_titulos')
    .select(`
      id,
      valor_total,
      created_at,
      transacoes:fin_transacoes(valor, tipo, tipo_transacao, data_pagamento)
    `)
    .eq('organization_id', orgId)
    .eq('tipo', 'RECEBER')
    .not('status', 'eq', 'CANCELADO');

  if (recError) console.error('Error fetching receivables:', recError);

  let totalRecebiveis = 0;
  for (const tit of (titulosReceber || [])) {
    const acrescimos = (tit.transacoes || [])
      .filter((tr) => tr.tipo_transacao === 'ACRESCIMO_TITULO' && tr.data_pagamento <= '2026-06-30T23:59:59.999Z')
      .reduce((acc, tr) => acc + Number(tr.valor), 0);

    const descontos = (tit.transacoes || [])
      .filter((tr) => tr.tipo_transacao === 'DESCONTO_TITULO' && tr.data_pagamento <= '2026-06-30T23:59:59.999Z')
      .reduce((acc, tr) => acc + Number(tr.valor), 0);

    const pagamentos = (tit.transacoes || [])
      .filter((tr) => tr.tipo_transacao !== 'DESCONTO_TITULO' && tr.tipo_transacao !== 'ACRESCIMO_TITULO' && tr.tipo_transacao !== 'EMPRESTIMO_CONCEDIDO' && tr.data_pagamento <= '2026-06-30T23:59:59.999Z')
      .reduce((acc, tr) => {
        if (tr.tipo === 'ENTRADA') return acc + Number(tr.valor);
        return acc - Number(tr.valor);
      }, 0);

    const balance = Math.max(0, Number(tit.valor_total) + acrescimos - descontos - pagamentos);
    totalRecebiveis += balance;
  }

  // D. Contas a Pagar
  const { data: titulosPagar, error: pagError } = await supabase
    .from('fin_titulos')
    .select(`
      id,
      valor_total,
      created_at,
      transacoes:fin_transacoes(valor, tipo, tipo_transacao, data_pagamento)
    `)
    .eq('organization_id', orgId)
    .eq('tipo', 'PAGAR')
    .not('status', 'eq', 'CANCELADO');

  if (pagError) console.error('Error fetching payables:', pagError);

  let totalPassivoCirculante = 0;
  for (const tit of (titulosPagar || [])) {
    const acrescimos = (tit.transacoes || [])
      .filter((tr) => tr.tipo_transacao === 'ACRESCIMO_TITULO' && tr.data_pagamento <= '2026-06-30T23:59:59.999Z')
      .reduce((acc, tr) => acc + Number(tr.valor), 0);

    const descontos = (tit.transacoes || [])
      .filter((tr) => tr.tipo_transacao === 'DESCONTO_TITULO' && tr.data_pagamento <= '2026-06-30T23:59:59.999Z')
      .reduce((acc, tr) => acc + Number(tr.valor), 0);

    const pagamentos = (tit.transacoes || [])
      .filter((tr) => tr.tipo_transacao !== 'DESCONTO_TITULO' && tr.tipo_transacao !== 'ACRESCIMO_TITULO' && tr.tipo_transacao !== 'EMPRESTIMO_CONCEDIDO' && tr.data_pagamento <= '2026-06-30T23:59:59.999Z')
      .reduce((acc, tr) => {
        if (tr.tipo === 'SAIDA') return acc + Number(tr.valor);
        return acc - Number(tr.valor);
      }, 0);

    const balance = Math.max(0, Number(tit.valor_total) + acrescimos - descontos - pagamentos);
    totalPassivoCirculante += balance;
  }

  const lucroMensal = (totalVendas - totalCustoVendas + lucroAdicionais + outrosCreditos + descontosObtidos) - (despesasFixas + despesasVariaveis + outrosDebitos + descontosConcedidos);
  const patrimonioLiquido = (saldoDisponivel + totalAtivosEstoque + totalRecebiveis) - totalPassivoCirculante;

  console.log(`\n--- CALCULATED VALUES ---`);
  console.log(`Total Entradas (Recebimentos Reais): R$ ${totalEntradas.toFixed(2)}`);
  console.log(`Total Saídas (Pagamentos Reais): R$ ${totalSaidas.toFixed(2)}`);
  console.log(`Lucro de Caixa Realizado (Entradas - Saídas): R$ ${(totalEntradas - totalSaidas).toFixed(2)}`);
  
  console.log(`\n--- DRE / Lucro Mensal (Competência Ajustada por Caixa) ---`);
  console.log(`(+) Receita de Vendas de Veículos: R$ ${totalVendas.toFixed(2)}`);
  console.log(`(-) Custo de Aquisição/Serviços das Vendas: R$ ${totalCustoVendas.toFixed(2)}`);
  console.log(`(=) Margem Bruta das Vendas: R$ ${(totalVendas - totalCustoVendas).toFixed(2)}`);
  console.log(`(+) Rendimentos de Empréstimos: R$ ${lucroAdicionais.toFixed(2)}`);
  console.log(`(+) Outros Créditos Recebidos (Extraordinários): R$ ${outrosCreditos.toFixed(2)}`);
  console.log(`(+) Descontos Obtidos: R$ ${descontosObtidos.toFixed(2)}`);
  console.log(`(-) Despesas Fixas Pagas: R$ ${despesasFixas.toFixed(2)}`);
  console.log(`(-) Despesas Variáveis Pagas: R$ ${despesasVariaveis.toFixed(2)}`);
  console.log(`(-) Outros Débitos Pagos: R$ ${outrosDebitos.toFixed(2)}`);
  console.log(`(-) Descontos Concedidos: R$ ${descontosConcedidos.toFixed(2)}`);
  console.log(`(=) Lucro Líquido do Mês (DRE): R$ ${lucroMensal.toFixed(2)}`);

  console.log(`\n--- BALANCES & EQUITY ---`);
  console.log(`Saldo Disponível Bancário: R$ ${saldoDisponivel.toFixed(2)}`);
  console.log(`Total Ativos em Estoque (${qtdVeiculosEstoque} veículos): R$ ${totalAtivosEstoque.toFixed(2)}`);
  console.log(`Total Contas a Receber: R$ ${totalRecebiveis.toFixed(2)}`);
  console.log(`Total Contas a Pagar (Passivo): R$ ${totalPassivoCirculante.toFixed(2)}`);
  console.log(`(=) Patrimônio Líquido Real: R$ ${patrimonioLiquido.toFixed(2)}`);
}

async function main() {
  const { data: orgs, error: orgsError } = await supabase.from('organizations').select('*');
  if (orgsError) {
    console.error('Error fetching organizations:', orgsError);
    return;
  }
  for (const org of orgs) {
    await runForOrg(org);
  }
}

main().catch(console.error);
