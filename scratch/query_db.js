const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

async function query() {
    const url = new URL(supabaseUrl + '/rest/v1/cad_formas_pagamento');
    url.searchParams.append('select', '*');
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
query();
