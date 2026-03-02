
import { supabase } from '../../lib/supabase';

export const RelatoriosService = {
    async getVendasParaRelatorio(params: { dataInicio: string; dataFim: string; vendedorId?: string }) {
        let query = supabase.from('venda_pedidos').select(`
      id, numero_venda, data_venda, valor_venda,
      cliente:parceiros(nome),
      veiculo:est_veiculos(
        valor_custo, valor_custo_servicos, placa,
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
      id, placa, ano_fabricacao, ano_modelo, cor, valor_custo, valor_custo_servicos, valor_venda, status,
      montadora:cad_montadoras(nome),
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
        id, placa, valor_custo, valor_custo_servicos, status,
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
    }
};
