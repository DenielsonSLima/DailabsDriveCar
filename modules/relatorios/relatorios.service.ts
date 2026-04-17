
import { supabase } from '../../lib/supabase';

export const RelatoriosService = {
    async getVendasParaRelatorio(params: { dataInicio: string; dataFim: string; vendedorId?: string }) {
        let query = supabase.from('venda_pedidos').select(`
      id, numero_venda, data_venda, valor_venda,
      cliente:parceiros(nome),
      veiculo:est_veiculos(
        valor_custo, valor_custo_servicos, valor_total_investido, placa,
        montadora:cad_montadoras(nome),
        modelo:cad_modelos(nome),
        versao:cad_versoes(nome)
      )
    `).eq('status', 'CONCLUIDO');

        if (params.dataInicio) query = query.gte('data_venda', params.dataInicio);
        if (params.dataFim) query = query.lte('data_venda', `${params.dataFim}T23:59:59`);
        if (params.vendedorId) query = query.eq('corretor_id', params.vendedorId);

        const { data, error } = await query.order('data_venda', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getEstoqueParaRelatorio(statusFiltro: string) {
        let query = supabase.from('est_veiculos').select(`
      id, placa, ano_fabricacao, ano_modelo, valor_custo, valor_custo_servicos, 
      valor_total_investido, valor_lucro_estimado, valor_margem_estimada,
      valor_venda, status, socios,
      montadora:cad_montadoras(nome, logo_url),
      modelo:cad_modelos(nome),
      versao:cad_versoes(nome)
    `);

        if (statusFiltro === 'DISPONIVEL') {
            query = query.eq('status', 'DISPONIVEL');
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getServicosParaRelatorio() {
        const { data, error } = await supabase
            .from('est_veiculos')
            .select(`
        id, placa, valor_custo, valor_custo_servicos, valor_total_investido, status,
        montadora:cad_montadoras(nome),
        modelo:cad_modelos(nome),
        versao:cad_versoes(nome),
        despesas:est_veiculos_despesas(id, data, descricao, valor_total, status_pagamento, categoria:fin_categorias(nome))
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getVendedoresAtivos() {
        const { data, error } = await supabase
            .from('cad_corretores')
            .select('id, nome')
            .eq('ativo', true)
            .order('nome');

        if (error) throw error;
        return data;
    },

    async getComissoesParaRelatorio(params: { dataInicio: string; dataFim: string; corretorId?: string }) {
        let query = supabase.from('venda_pedidos').select(`
      id, numero_venda, data_venda, valor_venda, corretor_id,
      cliente:parceiros(nome),
      veiculo:est_veiculos(placa, montadora:cad_montadoras(nome), modelo:cad_modelos(nome)),
      corretor:cad_corretores(nome, comissao_percentual)
    `).eq('status', 'CONCLUIDO').not('corretor_id', 'is', null);

        if (params.dataInicio) query = query.gte('data_venda', params.dataInicio);
        if (params.dataFim) query = query.lte('data_venda', `${params.dataFim}T23:59:59`);
        if (params.corretorId) query = query.eq('corretor_id', params.corretorId);

        const { data, error } = await query.order('data_venda', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getConciliacaoPatrimonial(params: { dataInicio: string; dataFim: string }) {
        const lastDayPrev = new Date(params.dataInicio);
        lastDayPrev.setDate(lastDayPrev.getDate() - 1);
        const dataFimPrev = lastDayPrev.toISOString().split('T')[0];

        // 1. Métricas do Mês Anterior (Saldo Inicial)
        const { data: metricsInicial, error: errorMin } = await supabase.rpc('get_caixa_metrics', {
            p_data_inicio: '2000-01-01',
            p_data_fim: dataFimPrev
        });
        if (errorMin) throw errorMin;

        // 2. Métricas do Mês Atual (Saldo Final e Lucro)
        const { data: metricsFinal, error: errorMax } = await supabase.rpc('get_caixa_metrics', {
            p_data_inicio: params.dataInicio,
            p_data_fim: params.dataFim
        });
        if (errorMax) throw errorMax;

        // 3. Extrato de Transações do Mês
        const { data: transacoes, error: errorTrans } = await supabase
            .from('fin_transacoes')
            .select(`
                id, data_pagamento, valor, tipo, descricao, categoria:fin_categorias(nome),
                titulo:fin_titulos(id, origem_tipo, parceiro:parceiros(nome))
            `)
            .gte('data_pagamento', `${params.dataInicio}T00:00:00Z`)
            .lte('data_pagamento', `${params.dataFim}T23:59:59Z`)
            .order('data_pagamento', { ascending: true });
        
        if (errorTrans) throw errorTrans;

        return {
            inicial: metricsInicial || {},
            final: metricsFinal || {},
            transacoes: transacoes || []
        };
    }
};

