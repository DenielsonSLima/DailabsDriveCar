import { supabase } from '../../../../lib/supabase';
import { PagarTab, IPagarFiltros, IPagarResponse, PagarResponseSchema } from './contas-pagar.types';

const TABLE = 'fin_titulos';

export const ContasPagarService = {
  async getAll(tab: PagarTab, filtros: IPagarFiltros): Promise<IPagarResponse> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 9;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from(TABLE)
      .select(`
        *,
        parceiro:parceiros(nome, documento),
        categoria:fin_categorias(nome)
      `, { count: 'exact' })
      .eq('tipo', 'PAGAR')
      .neq('status', 'CANCELADO');

    // Lógica de Abas Temporais
    const hoje = new Date().toISOString().split('T')[0];

    if (tab === 'EM_ABERTO') {
      query = query.neq('status', 'PAGO');
    } else if (tab === 'PAGOS') {
      query = query.eq('status', 'PAGO');
    }
    // Para 'TODOS', não adicionamos filtro de status (já removemos CANCELADO acima)

    // Aplicação de Filtros Dinâmicos
    if (filtros.busca) {
      query = query.or(`descricao.ilike.%${filtros.busca}%, documento_ref.ilike.%${filtros.busca}%`);
    }
    if (filtros.categoriaId) query = query.eq('categoria_id', filtros.categoriaId);
    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.dataInicio) query = query.gte('data_vencimento', filtros.dataInicio);
    if (filtros.dataFim) query = query.lte('data_vencimento', filtros.dataFim);

    const { data, error, count } = await query
      .order('data_vencimento', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar contas a pagar:', error);
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limit);

    const rawResponse = {
      data: data || [],
      count: count || 0,
      currentPage: page,
      totalPages
    };

    return PagarResponseSchema.parse(rawResponse) as IPagarResponse;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.rpc('excluir_titulo', { p_id: id });
    if (error) {
      console.error('Erro ao excluir título via RPC:', error);
      throw error;
    }
  },

  async getPagamentos(tituloId: string) {
    const { data, error } = await supabase
      .from('fin_transacoes')
      .select(`
        id,
        valor,
        tipo_transacao,
        data_pagamento,
        descricao,
        conta:fin_contas_bancarias(banco_nome, titular),
        forma:cad_formas_pagamento(nome)
      `)
      .eq('titulo_id', tituloId)
      .order('data_pagamento', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pagamentos do título:', error);
      throw error;
    }

    return data;
  },

  async getKpis() {
    const { data, error } = await supabase.rpc('get_submodule_kpis', {
      p_tipo: 'PAGAR'
    });

    if (error) {
      console.error('Erro ao buscar KPIs de contas a pagar:', error);
      throw error;
    }

    return data;
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('fin_contas_pagar_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onUpdate())
      .subscribe();
  }
};
