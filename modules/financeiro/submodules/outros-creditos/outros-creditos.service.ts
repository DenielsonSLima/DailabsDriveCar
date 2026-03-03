import { supabase } from '../../../../lib/supabase';
import { ITituloCredito, CreditosTab, ICreditoFiltros } from './outros-creditos.types';

const TABLE = 'fin_titulos';

export const OutrosCreditosService = {
  async getAll(tab: CreditosTab, filtros: ICreditoFiltros): Promise<ITituloCredito[]> {
    let query = supabase
      .from(TABLE)
      .select(`
        *,
        parceiro:parceiros(nome),
        transacoes:fin_transacoes(
          id,
          conta_origem:fin_contas_bancarias(banco_nome, conta)
        )
      `)
      .eq('tipo', 'RECEBER')
      .is('categoria_id', null)
      .is('pedido_id', null)
      .is('venda_pedido_id', null)
      .neq('origem_tipo', 'PEDIDO_VENDA')
      .in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']);

    if (tab === 'MES_ATUAL') {
      const now = new Date();
      const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      query = query.gte('data_vencimento', primeiroDia).lte('data_vencimento', ultimoDia);
    }

    if (filtros.busca) {
      query = query.or(`descricao.ilike.%${filtros.busca}%, documento_ref.ilike.%${filtros.busca}%`);
    }
    if (filtros.dataInicio) query = query.gte('data_vencimento', filtros.dataInicio);
    if (filtros.dataFim) query = query.lte('data_vencimento', filtros.dataFim);

    const { data, error } = await query.order('data_vencimento', { ascending: false });

    if (error) throw error;
    return data as any as ITituloCredito[];
  },

  async save(payload: {
    descricao: string;
    valor_total: number;
    data_vencimento: string;
    conta_id: string;
    documento_ref?: string;
    socios?: { socio_id: string; valor: number; porcentagem: number }[];
  }): Promise<void> {
    const { error } = await supabase.rpc('lancar_credito', {
      p_descricao: payload.descricao,
      p_valor: payload.valor_total,
      p_data_vencimento: payload.data_vencimento,
      p_conta_id: payload.conta_id,
      p_documento_ref: payload.documento_ref || null,
      p_socios: payload.socios && payload.socios.length > 0 ? payload.socios : null,
    });
    if (error) throw error;
  },

  async update(id: string, payload: {
    descricao: string;
    data_vencimento: string;
    documento_ref?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        descricao: payload.descricao,
        data_vencimento: payload.data_vencimento,
        documento_ref: payload.documento_ref || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.rpc('excluir_titulo', { p_id: id });
    if (error) {
      console.error('Erro ao excluir título via RPC:', error);
      throw error;
    }
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('fin_outros_creditos_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onUpdate())
      .subscribe();
  }
};
