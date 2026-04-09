import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('--- Checking Title: FORD KA ---');
  const { data: titles, error: titleError } = await supabase
    .from('fin_titulos')
    .select('*')
    .limit(10);

  if (titleError) {
    console.error('Error fetching titles:', titleError);
    return;
  }

  if (titles.length === 0) {
    console.log('No titles found for FORD KA');
    return;
  }

  for (const title of titles) {
    console.log(`\nTitle ID: ${title.id}`);
    console.log(`Desc: ${title.descricao}`);
    console.log(`Total: ${title.valor_total}`);
    console.log(`Pago (valor_pago): ${title.valor_pago}`);
    console.log(`Status: ${title.status}`);
    
    // Check if there are other fields like valor_liquidado or valor_pendente if they are columns
    console.log('Full Title Record:', JSON.stringify(title, null, 2));

    const { data: transacoes, error: transError } = await supabase
      .from('fin_transacoes')
      .select('*')
      .eq('titulo_id', title.id);

    if (transError) {
      console.error('Error fetching transacoes:', transError);
    } else {
      console.log(`Transactions (${transacoes.length}):`);
      let sum = 0;
      transacoes.forEach(t => {
        console.log(`- ID: ${t.id}, Valor: ${t.valor}, Data: ${t.data_pagamento}, Desc: ${t.descricao}`);
        sum += Number(t.valor);
      });
      console.log(`Sum of Transactions: ${sum}`);
      
      if (sum !== Number(title.valor_pago)) {
        console.log(`!!! DISCREPANCY DETECTED: Sum (${sum}) != valor_pago (${title.valor_pago})`);
      } else {
        console.log('Values are consistent.');
      }
    }
  }
}

check();
