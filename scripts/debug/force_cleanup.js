
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function forceClean() {
    console.log('--- INICIANDO LIMPEZA FORÇADA ---');

    // Ordem reversa de dependência
    const tables = [
        'fin_transacoes',
        'fin_titulos',
        'est_veiculos_despesas_pagamentos',
        'est_veiculos_despesas',
        'venda_pedidos_pagamentos',
        'cmp_pedidos_pagamentos',
        'venda_pedidos',
        'cmp_pedidos',
        'est_veiculos'
    ];

    for (const table of tables) {
        console.log(`Limpando tabela: ${table}...`);
        const { error, count } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            console.error(`Erro em ${table}:`, error.message);
        } else {
            console.log(`Sucesso em ${table}`);
        }
    }

    console.log('--- LIMPEZA CONCLUÍDA ---');
}

forceClean();
