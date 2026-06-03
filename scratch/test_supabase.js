const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('fin_titulos')
    .select(`
      *,
      parceiro:parceiros(nome, documento),
      categoria:fin_categorias(nome),
      veiculo:est_veiculos(
        placa,
        modelo:cad_modelos(nome),
        montadora:cad_montadoras(nome)
      )
    `)
    .eq('tipo', 'PAGAR')
    .neq('status', 'CANCELADO')
    .limit(1);

  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  console.log('Sample Row:', JSON.stringify(data[0], null, 2));
  console.log('typeof valor_total:', typeof data[0].valor_total);
  console.log('typeof valor_pago:', typeof data[0].valor_pago);
}

run();
