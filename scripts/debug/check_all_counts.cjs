
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAll() {
    const tables = [
        'est_veiculos',
        'venda_pedidos',
        'cmp_pedidos',
        'fin_titulos',
        'fin_transacoes'
    ];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`${table}: ERRO - ${error.message}`);
        } else {
            console.log(`${table}: ${count} registros`);
        }
    }
}

checkAll();
