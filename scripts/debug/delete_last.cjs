
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function forceDeleteLast() {
    const id = 'f3986e49-af2b-4ae7-bee6-75b73e8a9451';
    console.log(`--- TENTANDO EXCLUIR ÚLTIMO VEÍCULO: ${id} ---`);

    const { data, error, status } = await supabase
        .from('est_veiculos')
        .delete()
        .eq('id', id)
        .select();

    if (error) {
        console.error('Erro:', error.message);
    } else {
        console.log('Status:', status);
        console.log('Resultado:', data);
        if (data && data.length > 0) {
            console.log('Sucesso! Excluído.');
        } else {
            console.log('Bloqueado: O registro ainda persiste no banco.');
        }
    }
}

forceDeleteLast();
