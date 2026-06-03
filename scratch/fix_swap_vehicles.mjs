import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('=== STEP 1: Buscando os 5 últimos veículos ===');
  const { data: veiculos, error: errV } = await supabase
    .from('est_veiculos')
    .select('id, placa, modelo, marca, valor_compra, valor_fipe, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (errV) { console.error('Erro ao buscar veículos:', errV); return; }
  console.table(veiculos);

  // Identificar o Virtus e o Polo
  const virtus = veiculos.find(v => v.modelo && v.modelo.toUpperCase().includes('VIRTUS'));
  const polo = veiculos.find(v => v.modelo && v.modelo.toUpperCase().includes('POLO'));

  if (!virtus || !polo) {
    console.error('Não encontrei Virtus e/ou Polo nos últimos 5 veículos!');
    console.log('Veículos encontrados:', veiculos.map(v => `${v.modelo} (${v.placa})`));
    return;
  }

  console.log('\n=== Veículos identificados ===');
  console.log(`VIRTUS: id=${virtus.id}, placa=${virtus.placa}, valor_compra=${virtus.valor_compra}`);
  console.log(`POLO:   id=${polo.id}, placa=${polo.placa}, valor_compra=${polo.valor_compra}`);

  // Buscar lançamentos financeiros vinculados a esses veículos
  console.log('\n=== STEP 2: Buscando lançamentos financeiros vinculados ===');
  const { data: finVirtus, error: errFV } = await supabase
    .from('fin_lancamentos')
    .select('id, descricao, valor, tipo, status, veiculo_id, pedido_compra_id, origin_type, created_at')
    .eq('veiculo_id', virtus.id)
    .order('created_at', { ascending: false });

  if (errFV) console.error('Erro fin virtus:', errFV);
  else { console.log(`\nFinanceiro VIRTUS (${virtus.placa}):`); console.table(finVirtus); }

  const { data: finPolo, error: errFP } = await supabase
    .from('fin_lancamentos')
    .select('id, descricao, valor, tipo, status, veiculo_id, pedido_compra_id, origin_type, created_at')
    .eq('veiculo_id', polo.id)
    .order('created_at', { ascending: false });

  if (errFP) console.error('Erro fin polo:', errFP);
  else { console.log(`\nFinanceiro POLO (${polo.placa}):`); console.table(finPolo); }

  // Buscar pedidos de compra vinculados
  console.log('\n=== STEP 3: Buscando pedidos de compra vinculados ===');
  const { data: pcVirtus, error: errPCV } = await supabase
    .from('cmp_pedidos')
    .select('id, numero_pedido, valor_total, status, veiculo_id, created_at')
    .eq('veiculo_id', virtus.id);

  if (errPCV) console.error('Erro pc virtus:', errPCV);
  else { console.log(`\nPedido Compra VIRTUS:`); console.table(pcVirtus); }

  const { data: pcPolo, error: errPCP } = await supabase
    .from('cmp_pedidos')
    .select('id, numero_pedido, valor_total, status, veiculo_id, created_at')
    .eq('veiculo_id', polo.id);

  if (errPCP) console.error('Erro pc polo:', errPCP);
  else { console.log(`\nPedido Compra POLO:`); console.table(pcPolo); }

  console.log('\n=== DIAGNÓSTICO COMPLETO ===');
  console.log(JSON.stringify({ virtus, polo, finVirtus, finPolo, pcVirtus, pcPolo }, null, 2));
}

main().catch(console.error);
