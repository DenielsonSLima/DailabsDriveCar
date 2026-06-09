
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
      corretor:cad_corretores(nome)
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

        // 3. Extrato de Transações do Mês via RPC (calcula saldo do PL e tipo no banco)
        const { data: transacoesRaw, error: errorTrans } = await supabase.rpc('get_conciliacao_patrimonial_transacoes', {
            p_data_inicio: params.dataInicio,
            p_data_fim: params.dataFim
        });
        
        if (errorTrans) throw errorTrans;

        // Mapeia os dados para compatibilidade com o template e a página de relatórios
        const transacoes = (transacoesRaw || []).map((t: any) => {
            const isDesconto = t.tipo_transacao === 'DESCONTO_TITULO';
            let tipoMovimento = t.tipo;
            let mappedTipo = t.tipo;

            if (isDesconto) {
                // Inverte os sinais para exibição lógica correta dos descontos obtidos/concedidos:
                // - Desconto em contas a pagar (t.tipo === 'SAIDA') é um desconto OBTIDO (benefício/positivo)
                // - Desconto em contas a receber (t.tipo === 'ENTRADA') é um desconto CONCEDIDO (custo/negativo)
                tipoMovimento = t.tipo === 'SAIDA' ? 'ENTRADA' : 'SAIDA';
                mappedTipo = t.tipo === 'SAIDA' ? 'ENTRADA' : 'SAIDA';
            }

            return {
                id: t.id,
                data_pagamento: t.data_pagamento,
                data: t.data_pagamento,
                valor: t.valor,
                tipo: mappedTipo,
                tipo_movimento: tipoMovimento,
                tipo_transacao: t.tipo_transacao,
                descricao: t.descricao,
                tipo_descricao: t.tipo_descricao,
                patrimonio_liquido: t.patrimonio_liquido,
                categoria: t.categoria_nome ? { nome: t.categoria_nome } : null,
                titulo: {
                    origem_tipo: t.origem_tipo,
                    parceiro: t.parceiro_nome ? { nome: t.parceiro_nome } : null
                }
            };
        });

        // Usa os totais oficiais do banco de dados (que já excluem descontos e estornos do fluxo financeiro físico)
        const totalEntradas = metricsFinal?.total_entradas || 0;
        const totalSaidas = metricsFinal?.total_saidas || 0;

        return {
            inicial: metricsInicial || {},
            final: metricsFinal || {},
            transacoes: transacoes || [],
            patrimonio_inicial: metricsInicial?.patrimonio_liquido || 0,
            patrimonio_final: metricsFinal?.patrimonio_liquido || 0,
            total_entradas: totalEntradas,
            total_saidas: totalSaidas
        };
    }
};

