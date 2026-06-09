import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbWhsbHRtZ3d4bGlia2x5cnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTgzNSwiZXhwIjoyMDg0NDg1ODM1fQ.TRhHESMAGYnQ0JBZRoEPVFMbGvP2F1OuZj7AyrQ5XUw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runTests() {
  console.log('=== RUNNING ALL REPORT DATABASE QUERIES VERIFICATION ===\n');

  // Query 1: Sales Report Query
  try {
    const { data, error } = await supabase.from('venda_pedidos').select(`
      id, numero_venda, data_venda, valor_venda,
      cliente:parceiros(nome),
      veiculo:est_veiculos(
        valor_custo, valor_custo_servicos, valor_total_investido, placa,
        montadora:cad_montadoras(nome),
        modelo:cad_modelos(nome),
        versao:cad_versoes(nome)
      )
    `).eq('status', 'CONCLUIDO').limit(1);
    if (error) throw error;
    console.log('✅ Sales Report Query: SUCCESS');
  } catch (e) {
    console.error('❌ Sales Report Query: FAILED -', e.message);
  }

  // Query 2: Inventory Report Query
  try {
    const { data, error } = await supabase.from('est_veiculos').select(`
      id, placa, ano_fabricacao, ano_modelo, valor_custo, valor_custo_servicos, 
      valor_total_investido, valor_lucro_estimado, valor_margem_estimada,
      valor_venda, status, socios,
      montadora:cad_montadoras(nome, logo_url),
      modelo:cad_modelos(nome),
      versao:cad_versoes(nome)
    `).limit(1);
    if (error) throw error;
    console.log('✅ Inventory Report Query: SUCCESS');
  } catch (e) {
    console.error('❌ Inventory Report Query: FAILED -', e.message);
  }

  // Query 3: Services/Expenses Report Query
  try {
    const { data, error } = await supabase.from('est_veiculos').select(`
      id, placa, valor_custo, valor_custo_servicos, valor_total_investido, status,
      montadora:cad_montadoras(nome),
      modelo:cad_modelos(nome),
      versao:cad_versoes(nome),
      despesas:est_veiculos_despesas(id, data, descricao, valor_total, status_pagamento, categoria:fin_categorias(nome))
    `).limit(1);
    if (error) throw error;
    console.log('✅ Services/Expenses Report Query: SUCCESS');
  } catch (e) {
    console.error('❌ Services/Expenses Report Query: FAILED -', e.message);
  }

  // Query 4: Commissions Report Query (Corrected!)
  try {
    const { data, error } = await supabase.from('venda_pedidos').select(`
      id, numero_venda, data_venda, valor_venda, corretor_id,
      cliente:parceiros(nome),
      veiculo:est_veiculos(placa, montadora:cad_montadoras(nome), modelo:cad_modelos(nome)),
      corretor:cad_corretores(nome)
    `).eq('status', 'CONCLUIDO').not('corretor_id', 'is', null).limit(1);
    if (error) throw error;
    console.log('✅ Commissions Report Query: SUCCESS');
  } catch (e) {
    console.error('❌ Commissions Report Query: FAILED -', e.message);
  }

  // Query 5: Financial History (Transactions)
  try {
    const { data, error } = await supabase.from('fin_transacoes').select(`
      id, valor, data_pagamento, tipo, tipo_transacao, descricao,
      titulo:fin_titulos(id, descricao, pedido_id, tipo, parcela_numero, parcela_total, status, parceiro:parceiros(nome)),
      conta:fin_contas_bancarias(banco_nome),
      forma_pagamento:cad_formas_pagamento(nome)
    `).limit(1);
    if (error) throw error;
    console.log('✅ Financial History (Transactions) Query: SUCCESS');
  } catch (e) {
    console.error('❌ Financial History (Transactions) Query: FAILED -', e.message);
  }

  // Query 6: Financial History (Titles/Expected - Corrected!)
  try {
    const { data, error } = await supabase.from('fin_titulos').select(`
      id, descricao, tipo, status, valor_total, valor_pago,
      data_emissao, data_vencimento, parcela_numero, parcela_total,
      pedido_id, despesa_veiculo_id,
      parceiro:parceiros(nome),
      categoria:fin_categorias(nome, natureza),
      forma_pagamento:cad_formas_pagamento(nome)
    `).in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']).limit(1);
    if (error) throw error;
    console.log('✅ Financial History (Titles) Query: SUCCESS');
  } catch (e) {
    console.error('❌ Financial History (Titles) Query: FAILED -', e.message);
  }

  // Query 7: Bank Statement Transactions
  try {
    const { data, error } = await supabase.from('fin_transacoes').select(`
      id, valor, data_pagamento, tipo, tipo_transacao, descricao,
      titulo:fin_titulos(descricao, status, parceiro:parceiros(nome)),
      forma_pagamento:cad_formas_pagamento(nome)
    `).limit(1);
    if (error) throw error;
    console.log('✅ Bank Statement Transactions Query: SUCCESS');
  } catch (e) {
    console.error('❌ Bank Statement Transactions Query: FAILED -', e.message);
  }

  // Query 8: Equity Reconciliation Transactions
  try {
    const { data, error } = await supabase.from('fin_transacoes').select(`
      id, data_pagamento, valor, tipo, tipo_transacao, descricao,
      titulo:fin_titulos(id, origem_tipo, categoria:fin_categorias(nome), parceiro:parceiros(nome))
    `).limit(1);
    if (error) throw error;
    console.log('✅ Equity Reconciliation Transactions Query: SUCCESS');
  } catch (e) {
    console.error('❌ Equity Reconciliation Transactions Query: FAILED -', e.message);
  }

  console.log('\n=== VERIFICATION FINISHED ===');
}

runTests().catch(console.error);
