
const { createClient } = require('@supabase/supabase-js');

// Configuration from lib/supabase.ts
const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPerformanceQueries() {
    console.log("--- Testing Strategic KPIs Queries ---");
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // 1. Capital Imobilizado
    const { data: stockData, error: stockError } = await supabase
        .from('est_veiculos')
        .select('valor_custo')
        .eq('status', 'DISPONIVEL');

    if (stockError) console.error("Stock Error:", stockError);
    else console.log("Stock Items:", stockData.length);

    // 2. Sales
    const { data: salesData, error: salesError } = await supabase
        .from('venda_pedidos')
        .select(`
        valor_venda,
        veiculo:est_veiculos(valor_custo)
      `)
        .eq('status', 'CONCLUIDO')
        .gte('data_venda', startOfMonth);

    if (salesError) console.error("Sales Error:", salesError);
    else console.log("Sales Items (Current Month):", salesData.length);

    console.log("\n--- Testing Sales Performance Query ---");
    const { data: salesPerfData, error: salesPerfError } = await supabase
        .from('venda_pedidos')
        .select(`
            valor_venda,
            user_id,
            veiculo:est_veiculos(valor_custo)
        `)
        .eq('status', 'CONCLUIDO')
        .limit(5);

    if (salesPerfError) console.error("Sales Perf Error:", salesPerfError);
    else console.log("Sales Perf Sample:", JSON.stringify(salesPerfData, null, 2));

    console.log("\n--- Testing Operational Performance Query ---");
    const { data: opData, error: opError } = await supabase
        .from('venda_pedidos')
        .select('data_venda, veiculo:est_veiculos(created_at)')
        .eq('status', 'CONCLUIDO')
        .limit(5);

    if (opError) console.error("Op Performance Error:", opError);
    else console.log("Op Performance Sample:", JSON.stringify(opData, null, 2));
}

testPerformanceQueries();
