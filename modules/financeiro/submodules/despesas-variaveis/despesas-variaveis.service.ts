import { supabase } from '../../../../lib/supabase';
import { ITituloVariavel, VariaveisTab, IVariaveisFiltros } from './despesas-variaveis.types';
import { FinanceiroService } from '../../financeiro.service';
import { ILancarDespesaPayload } from '../../financeiro.types';

const TABLE = 'fin_titulos';

export const DespesasVariaveisService = {
  async getAll(tab: VariaveisTab, filtros: IVariaveisFiltros): Promise<ITituloVariavel[]> {
    let query = supabase
      .from(TABLE)
      .select(`
        *,
        parceiro:parceiros(nome),
        categoria:fin_categorias!inner(id, nome, tipo)
      `)
      .eq('tipo', 'PAGAR')
      .eq('fin_categorias.tipo', 'VARIAVEL')
      .neq('status', 'CANCELADO');

    const hoje = new Date().toISOString().split('T')[0];

    if (tab === 'MES_ATUAL') {
      const now = new Date();
      const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      query = query.gte('data_vencimento', primeiroDia).lte('data_vencimento', ultimoDia);
    } else if (tab === 'ATRASADOS') {
      query = query.lt('data_vencimento', hoje).neq('status', 'PAGO').neq('status', 'CANCELADO');
    } else if (tab === 'FUTUROS') {
      const now = new Date();
      // O mês atual termina nesse dia, logo o próximo mês começa no "primeiroDiaProximoMes"
      const primeiroDiaProximoMes = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
      query = query.gte('data_vencimento', primeiroDiaProximoMes).neq('status', 'PAGO').neq('status', 'CANCELADO');
    }

    if (filtros.busca) {
      query = query.or(`descricao.ilike.%${filtros.busca}%, documento_ref.ilike.%${filtros.busca}%`);
    }
    if (filtros.categoriaId) query = query.eq('categoria_id', filtros.categoriaId);
    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.dataInicio) query = query.gte('data_vencimento', filtros.dataInicio);
    if (filtros.dataFim) query = query.lte('data_vencimento', filtros.dataFim);

    const { data, error } = await query.order('data_vencimento', { ascending: true });

    if (error) throw error;
    return data as any as ITituloVariavel[];
  },

  async save(payload: {
    descricao: string;
    valor_total: number;
    categoria_id: string;
    qtd_parcelas: number;
    data_vencimento: string;
    dias_intervalo: number;
    pago_avista: boolean;
    conta_id?: string;
    forma_pagamento_id?: string;
    documento_ref?: string;
  }): Promise<void> {
    await FinanceiroService.lancarDespesa({
      ...payload,
      natureza: 'VARIAVEL'
    });
  },

  async update(id: string, payload: {
    descricao: string;
    valor_total: number;
    categoria_id: string;
    data_vencimento: string;
    grupo_id?: string;
    documento_ref?: string;
  }): Promise<void> {
    const { error } = await supabase.rpc('atualizar_titulo', {
      p_id: id,
      p_descricao: payload.descricao,
      p_valor_total: payload.valor_total,
      p_categoria_id: payload.categoria_id,
      p_data_vencimento: payload.data_vencimento,
      p_documento_ref: payload.documento_ref || null
    });
    if (error) {
      console.error('Erro ao atualizar título via RPC:', error);
      throw error;
    }
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
      .channel('fin_despesas_variaveis_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onUpdate())
      .subscribe();
  }
};
