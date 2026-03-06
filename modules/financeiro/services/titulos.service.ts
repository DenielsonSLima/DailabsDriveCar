import { supabase } from '../../../lib/supabase';
import { ITitulo, ILancarDespesaPayload } from '../financeiro.types';

export const TitulosService = {
  async getTitulos(filtros: { tipo?: 'PAGAR' | 'RECEBER', status?: string }): Promise<ITitulo[]> {
    let query = supabase
      .from('fin_titulos')
      .select('id, descricao, tipo, status, valor_total, valor_pago, data_emissao, data_vencimento, parcela_numero, parcela_total, parceiro_id, categoria_id, parceiro:parceiros(nome), categoria:fin_categorias(nome)');

    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.status) query = query.eq('status', filtros.status);

    const { data, error } = await query.order('data_vencimento', { ascending: true });
    if (error) throw error;
    return data as unknown as ITitulo[];
  },

  async baixarTitulo(titulo: ITitulo, valor: number, contaId: string, formaId: string, desconto = 0, acrescimo = 0, dataPagamento?: string): Promise<void> {
    const { error } = await supabase.rpc('baixar_titulo', {
      p_titulo_id: titulo.id,
      p_valor: valor,
      p_conta_id: contaId,
      p_forma_pagamento_id: formaId,
      p_data_pagamento: dataPagamento || new Date().toISOString().split('T')[0],
      p_desconto: desconto,
      p_acrescimo: acrescimo
    });

    if (error) {
      console.error('Erro ao baixar título via RPC:', error);
      throw error;
    }
  },

  async lancarDespesa(payload: ILancarDespesaPayload): Promise<void> {
    const { error } = await supabase.rpc('lancar_despesa_financeira', {
      p_descricao: payload.descricao,
      p_valor_total: payload.valor_total,
      p_categoria_id: payload.categoria_id,
      p_qtd_parcelas: payload.qtd_parcelas,
      p_data_vencimento: payload.data_vencimento,
      p_dias_intervalo: payload.dias_intervalo,
      p_pago_avista: payload.pago_avista,
      p_conta_id: payload.conta_id || null,
      p_forma_pagamento_id: payload.forma_pagamento_id || null,
      p_natureza: payload.natureza,
      p_documento_ref: payload.documento_ref || null
    });

    if (error) {
      console.error('Erro ao lançar despesa via RPC:', error);
      throw error;
    }
  },

  async previewCronograma(params: {
    valorTotal: number,
    condicaoId?: string,
    tipo?: 'COMPRA' | 'VENDA',
    qtdParcelas?: number,
    diasPrimeira?: number,
    diasEntre?: number
  }): Promise<any[]> {
    const { data, error } = await supabase.rpc('preview_cronograma', {
      p_valor_total: params.valorTotal,
      p_condicao_id: params.condicaoId && !params.condicaoId.startsWith('__auto') ? params.condicaoId : null,
      p_tipo_condicao: params.tipo || null,
      p_qtd_parcelas: params.qtdParcelas || null,
      p_dias_primeira: params.diasPrimeira || null,
      p_dias_entre: params.diasEntre || null
    });

    if (error) {
      console.error('Erro ao gerar prévia de cronograma:', error);
      throw error;
    }
    return data || [];
  },

  async getTitulosByPedidoId(pedidoId: string, tipo: 'COMPRA' | 'VENDA' = 'COMPRA'): Promise<ITitulo[]> {
    const coluna = tipo === 'VENDA' ? 'venda_pedido_id' : 'pedido_id';
    const { data, error } = await supabase
      .from('fin_titulos')
      .select('*')
      .eq(coluna, pedidoId);

    if (error) throw error;
    return (data || []) as ITitulo[];
  },

  async excluirPagamento(transacaoId: string, tituloId: string): Promise<void> {
    // 1. Deleta a transação
    const { error: deleteError } = await supabase
      .from('fin_transacoes')
      .delete()
      .eq('id', transacaoId);

    if (deleteError) throw deleteError;

    // 2. Recalcula o título
    await this.recalcularTitulo(tituloId);
  },

  async editarPagamento(transacaoId: string, tituloId: string, dados: { valor: number, data_pagamento: string }): Promise<void> {
    // 1. Atualiza a transação
    const { error: updateTransError } = await supabase
      .from('fin_transacoes')
      .update({
        valor: dados.valor,
        data_pagamento: dados.data_pagamento,
      })
      .eq('id', transacaoId);

    if (updateTransError) throw updateTransError;

    // 2. Recalcula o título
    await this.recalcularTitulo(tituloId);
  },

  async recalcularTitulo(tituloId: string): Promise<void> {
    // 1. Busca todas as transações do título
    const { data: transacoes, error: transError } = await supabase
      .from('fin_transacoes')
      .select('valor')
      .eq('titulo_id', tituloId);

    if (transError) throw transError;

    const valorPago = (transacoes || []).reduce((acc, t) => acc + Number(t.valor), 0);

    // 2. Busca o valor total do título
    const { data: titulo, error: tituloError } = await supabase
      .from('fin_titulos')
      .select('valor_total')
      .eq('id', tituloId)
      .single();

    if (tituloError) throw tituloError;

    // 3. Define novo status
    let status: 'PENDENTE' | 'PARCIAL' | 'PAGO' = 'PENDENTE';
    if (valorPago >= titulo.valor_total) {
      status = 'PAGO';
    } else if (valorPago > 0) {
      status = 'PARCIAL';
    }

    // 4. Atualiza o título
    const { error: updateError } = await supabase
      .from('fin_titulos')
      .update({
        valor_pago: valorPago,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tituloId);

    if (updateError) throw updateError;
  }
};
