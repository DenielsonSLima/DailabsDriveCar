const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

async function testQuery() {
    const url = new URL(supabaseUrl + '/rest/v1/cmp_pedidos');

    url.searchParams.append('select', 'id,veiculos:est_veiculos!est_veiculos_pedido_id_fkey(id,status)');
    url.searchParams.append('status', 'eq.CONCLUIDO');
    url.searchParams.append('limit', '5');

    try {
        const res = await fetch(url.toString(), {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });

        const body = await res.json();
        console.log(JSON.stringify(body, null, 2));

    } catch (err) {
        console.error(err);
    }
}

testQuery();
