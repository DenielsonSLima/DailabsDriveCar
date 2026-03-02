const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Try to use rpc to get schema if allowed, otherwise just list columns from a query
  const tables = ['fin_titulos', 'fin_transacoes', 'fin_categorias'];
  for (const table of tables) {
     console.log(`\n--- Table: ${table} ---`);
     const { data, error } = await supabase.from(table).select('*').limit(1);
     if (error) {
       console.error(`Error fetching ${table}:`, error.message);
     } else if (data && data.length > 0) {
       console.log(Object.keys(data[0]).map(k => `${k}: ${typeof data[0][k]}`).join('\n'));
     } else {
       console.log("No rows, can't infer schema easily without rpc/admin pg access");
     }
  }
}
run();
