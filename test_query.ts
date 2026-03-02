import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://example.com';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'example';

// Let's read from the actual env if we can
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.VITE_SUPABASE_ANON_KEY as string
);

async function testQuery() {
    const { data, error } = await supabase
        .from('cmp_pedidos')
        .select(`
      id,
      numero_pedido,
      status,
      veiculos:est_veiculos(id, status),
      filtro_veiculos:est_veiculos!inner(id, status)
    `)
        .eq('status', 'CONCLUIDO')
        .neq('filtro_veiculos.status', 'VENDIDO')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Success!', JSON.stringify(data, null, 2));
}

testQuery();
