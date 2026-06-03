// Script de diagnóstico - roda via node com supabase-js local
const { createClient } = require('/Users/denielson/Desktop/Dailabs DriveCar/node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

async function main() {
  console.log('=== STEP 1: Últimos 10 veículos ===');
  const { data: veiculos, error: errV } = await supabase
    .from('est_veiculos')
    .select('id, placa, modelo, marca, valor_compra, valor_fipe, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (errV) { console.error('ERRO veiculos:', JSON.stringify(errV)); process.exit(1); }
  console.log(JSON.stringify(veiculos, null, 2));
  
  const virtus = veiculos.find(v => v.modelo && v.modelo.toUpperCase().includes('VIRTUS'));
  const polo = veiculos.find(v => v.modelo && v.modelo.toUpperCase().includes('POLO'));

  if (!virtus || !polo) {
    console.error('NAO ENCONTREI Virtus/Polo nos últimos 10!');
    console.log('Modelos:', veiculos.map(v => `${v.modelo} (${v.placa}) R$${v.valor_compra}`));
    process.exit(1);
  }

  console.log('\n=== IDENTIFICADOS ===');
  console.log('VIRTUS:', JSON.stringify(virtus));
  console.log('POLO:', JSON.stringify(polo));

  // Financeiro
  console.log('\n=== FIN VIRTUS ===');
  const { data: fv } = await supabase.from('fin_lancamentos')
    .select('id, descricao, valor, tipo, status, veiculo_id, pedido_compra_id, origin_type')
    .eq('veiculo_id', virtus.id);
  console.log(JSON.stringify(fv, null, 2));

  console.log('\n=== FIN POLO ===');
  const { data: fp } = await supabase.from('fin_lancamentos')
    .select('id, descricao, valor, tipo, status, veiculo_id, pedido_compra_id, origin_type')
    .eq('veiculo_id', polo.id);
  console.log(JSON.stringify(fp, null, 2));

  // Pedidos compra
  console.log('\n=== PC VIRTUS ===');
  const { data: pcv } = await supabase.from('cmp_pedidos')
    .select('id, numero_pedido, valor_total, status, veiculo_id')
    .eq('veiculo_id', virtus.id);
  console.log(JSON.stringify(pcv, null, 2));

  console.log('\n=== PC POLO ===');
  const { data: pcp } = await supabase.from('cmp_pedidos')
    .select('id, numero_pedido, valor_total, status, veiculo_id')
    .eq('veiculo_id', polo.id);
  console.log(JSON.stringify(pcp, null, 2));

  // Itens pedido
  if (pcv && pcv.length) {
    console.log('\n=== ITENS PC VIRTUS ===');
    const { data: iv } = await supabase.from('cmp_pedido_itens')
      .select('id, pedido_id, veiculo_id, valor_unitario, quantidade, valor_total')
      .in('pedido_id', pcv.map(p => p.id));
    console.log(JSON.stringify(iv, null, 2));
  }

  if (pcp && pcp.length) {
    console.log('\n=== ITENS PC POLO ===');
    const { data: ip } = await supabase.from('cmp_pedido_itens')
      .select('id, pedido_id, veiculo_id, valor_unitario, quantidade, valor_total')
      .in('pedido_id', pcp.map(p => p.id));
    console.log(JSON.stringify(ip, null, 2));
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
