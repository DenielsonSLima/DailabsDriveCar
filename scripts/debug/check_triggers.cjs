
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTriggers() {
    const { data, error } = await supabase.rpc('get_table_triggers', { p_table_name: 'est_veiculos' });

    if (error) {
        console.log('RPC get_table_triggers not found. Attempting to query pg_trigger...');
        // We can't query pg_trigger directly via anon key.
    } else {
        console.log('Triggers:', data);
    }

    // Check for foreign keys pointing to est_veiculos
    const { data: fks, error: err2 } = await supabase.rpc('get_table_fks', { p_table_name: 'est_veiculos' });
    if (err2) {
        console.log('RPC get_table_fks not found.');
    } else {
        console.log('Foreign Keys:', fks);
    }
}

checkTriggers();

// Alternative: check if the remaining vehicle has a specific status or flag
async function checkStats() {
    const { data: v } = await supabase.from('est_veiculos').select('status, publicado_site').limit(1);
    console.log('Remaining vehicle sample:', v);
}
checkStats();
