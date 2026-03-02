const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hlmhlltmgwxlibklyrzc.supabase.co', 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1');

(async () => {
  const { data, error } = await supabase.rpc('get_caixa_patrimonio_socios', { p_data_inicio: '2020-01-01', p_data_fim: '2030-01-01' });
  if (error) console.error(error);
  else console.log(JSON.stringify(data[0]?.veiculos || [], null, 2));
})();
