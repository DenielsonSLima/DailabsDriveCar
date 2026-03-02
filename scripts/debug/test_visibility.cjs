
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('--- VERIFICANDO DADOS ---');

    const { data, error, count } = await supabase
        .from('est_veiculos')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Erro:', error.message);
    } else {
        console.log('Total de veículos encontrados:', count);
        if (data && data.length > 0) {
            console.log('Exemplos de IDs encontrados:', data.slice(0, 3).map(v => v.id));
        } else {
            console.log('Nenhum veículo visível para a chave anon.');
        }
    }
}

checkData();
