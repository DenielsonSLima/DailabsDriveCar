
import { createClient } from '@supabase/supabase-js';

// Configuration from lib/supabase.ts
const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    console.log("Testing query...");

    const aba: string = 'EFETIVADOS';
    const filtros = {
        dataInicio: '2026-02-01',
        dataFim: '2026-02-28',
        corretorId: '',
        busca: ''
    };

    let query = supabase
        .from('cmp_pedidos')
        .select(`
        *,
        fornecedor:parceiros(nome, documento, cidade, uf),
        corretor:cad_corretores(nome, sobrenome),
        veiculos:est_veiculos(
          id,
          valor_custo,
          valor_custo_servicos,
          placa,
          fotos,
          montadora:cad_montadoras(nome, logo_url),
          modelo:cad_modelos(nome),
          versao:cad_versoes(nome)
        )
      `, { count: 'exact' });

    // Filtros
    if (aba === 'RASCUNHO') query = query.eq('status', 'RASCUNHO');
    if (aba === 'EFETIVADOS') query = query.in('status', ['CONCLUIDO', 'RASCUNHO']);

    if (filtros.dataInicio) query = query.gte('data_compra', filtros.dataInicio);
    if (filtros.dataFim) query = query.lte('data_compra', `${filtros.dataFim}T23:59:59`);
    // if (filtros.corretorId) query = query.eq('corretor_id', filtros.corretorId);
    // if (filtros.busca) query = query.ilike('numero_pedido', `%${filtros.busca}%`);

    const { data, error, count } = await query.range(0, 9);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Count:", count);
        console.log("Data length:", data.length);
        console.log("Data:", JSON.stringify(data, null, 2));
    }
}

testQuery();
