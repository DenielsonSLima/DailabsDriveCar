
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { p_table_name: 'est_veiculos' });

    // If RPC doesn't exist, try a simple select from a non-existent column to trigger an error with hints
    const { error: err2 } = await supabase.from('est_veiculos').select('*').limit(1);

    if (err2) {
        console.log('Sample Data Key Names:', Object.keys(err2.details || {}));
    }

    const { data: sample } = await supabase.from('est_veiculos').select('*').limit(1);
    if (sample && sample.length > 0) {
        console.log('Columns in est_veiculos:', Object.keys(sample[0]));
    } else {
        console.log('No data to infer columns from sample.');
    }
}

checkColumns();
