
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkVehicle() {
    const id = '8f859267-dd97-40da-a4c9-531197e5b38e';
    const { data, error } = await supabase
        .from('est_veiculos')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Erro:', error.message);
    } else {
        console.log('Veículo:', JSON.stringify(data, null, 2));
    }
}

checkVehicle();
