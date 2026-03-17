import { supabase } from '../../../../lib/supabase';
import { TitulosService } from '../../services/titulos.service';
import { ITituloCredito, CreditosTab, ICreditoFiltros } from './outros-creditos.types';

const TABLE = 'fin_titulos';

export const OutrosCreditosService = {
  async getAll(tab: CreditosTab, filtros: ICreditoFiltros) {
    let query = supabase
      .from(TABLE)
      .select('*, transacoes:fin_transacoes(*, conta_origem:fin_contas_bancarias(*), forma:cad_formas_pagamento(*)), categoria:fin_categorias(*), parceiro:parceiros(*)', { count: 'exact' })
      .eq('tipo', 'RECEBER')
      .eq('origem_tipo', 'OUTRO_CREDITO')
      .order('data_vencimento', { ascending: false });

    if (tab === 'ABERTO') {
      query = query.neq('status', 'PAGO');
    } else if (tab === 'PAGO') {
      query = query.eq('status', 'PAGO');
    }

    if (filtros.busca) {
      query = query.ilike('descricao', `%${filtros.busca}%`);
    }
    if (filtros.dataInicio) {
      query = query.gte('data_vencimento', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data_vencimento', filtros.dataFim);
    }

    // Pagination
    if (filtros.page !== undefined && filtros.pageSize !== undefined) {
      const from = filtros.page * filtros.pageSize;
      const to = from + filtros.pageSize - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data as ITituloCredito[], count: count || 0 };
  },

  async getRecebimentos(tituloId: string) {
    const { data, error } = await supabase
      .from('fin_transacoes')
      .select('*, conta:fin_contas_bancarias(*), forma:cad_formas_pagamento(*)')
      .eq('titulo_id', tituloId)
      .order('data_pagamento', { ascending: false });

    if (error) throw error;
    return data;
  },

  async save(payload: {
    descricao: string;
    valor_total: number;
    data_vencimento: string;
    conta_id: string;
    documento_ref?: string;
    socios?: { socio_id: string; valor: number; porcentagem: number }[];
  }) {
    const { data, error } = await supabase.rpc('lancar_credito', {
      p_descricao: payload.descricao,
      p_valor: payload.valor_total,
      p_data_vencimento: payload.data_vencimento,
      p_conta_id: payload.conta_id,
      p_documento_ref: payload.documento_ref || null,
      p_socios: payload.socios && payload.socios.length > 0 ? payload.socios : null,
    });
    if (error) throw error;
    return data;
  },

  async update(id: string, payload: {
    descricao: string;
    data_vencimento: string;
    documento_ref?: string;
    socios?: { socio_id: string; valor: number; porcentagem: number }[];
  }) {
    const { error } = await supabase
      .from(TABLE)
      .update({
        descricao: payload.descricao,
        data_vencimento: payload.data_vencimento,
        documento_ref: payload.documento_ref,
        socios: payload.socios
      })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  async getFormasPagamento() {
    const { data } = await supabase
      .from('cad_formas_pagamento')
      .select('*')
      .eq('ativo', true)
      .in('tipo_movimentacao', ['RECEBIMENTO', 'AMBOS'])
      .neq('destino_lancamento', 'CONSIGNACAO')
      .order('nome');
    return data;
  },

  async baixarCredito(tituloId: string, payload: {
    valor: number;
    data_pagamento: string;
    conta_id: string;
    forma_pagamento_id: string;
  }) {
    return TitulosService.baixarTitulo({ id: tituloId } as any, payload.valor, payload.conta_id, payload.forma_pagamento_id, 0, 0, payload.data_pagamento);
  },

  async getKpis() {
    const { data, error } = await supabase.rpc('rpc_kpi_outros_creditos');

    if (error) {
      console.error('Erro ao buscar KPIs de outros créditos:', error);
      throw error;
    }

    return data;
  },

  subscribe(callback: () => void) {
    return supabase
      .channel('fin_outros_creditos_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => callback())
      .subscribe();
  }
};
