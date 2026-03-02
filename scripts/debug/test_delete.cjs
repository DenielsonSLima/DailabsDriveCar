
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDelete() {
    const targetId = '8f859267-dd97-40da-a4c9-531197e5b38e';
    console.log(`--- TESTANDO EXCLUSÃO DO ID: ${targetId} ---`);

    const { data, error, status, statusText } = await supabase
        .from('est_veiculos')
        .delete()
        .eq('id', targetId)
        .select();

    console.log('Status:', status);
    console.log('StatusText:', statusText);
    if (error) {
        console.error('Erro:', error.message);
    } else {
        console.log('Dados alterados:', data);
        if (data && data.length > 0) {
            console.log('Sucesso! Registro excluído.');
        } else {
            console.log('Falha silenciosa: O registro não foi excluído (provavelmente bloqueado por RLS).');
        }
    }
}

testDelete();
