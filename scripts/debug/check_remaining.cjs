
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRemaining() {
    const { data, error } = await supabase
        .from('est_veiculos')
        .select('id, created_at, placa, user_id, organization_id')
        .eq('id', 'f3986e49-af2b-4ae7-bee6-75b73e8a9451')
        .single();

    if (error) {
        console.error('Erro:', error.message);
    } else {
        console.log('Veículo Remanescente:', JSON.stringify(data, null, 2));
    }
}

checkRemaining();
