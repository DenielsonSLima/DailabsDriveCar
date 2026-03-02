import { supabase } from '../../lib/supabase';
import { ITitulo, ITransacao, ICategoriaFinanceira, IFinanceiroKpis, IExtratoFiltros, IExtratoResponse, IExtratoTotals, IPendencias, IHistoricoFiltros, IHistoricoResponse, IHistoricoTotals, IHistoricoUnificado, OrigemHistorico, StatusHistorico, ILancarDespesaPayload } from './financeiro.types';
import { IContaBancaria } from '../ajustes/contas-bancarias/contas.types';

export const FinanceiroService = {
  async getTitulos(filtros: { tipo?: 'PAGAR' | 'RECEBER', status?: string }): Promise<ITitulo[]> {
    // Otimização: Selecionando colunas essenciais
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
      p_desconto: desconto,
      p_acrescimo: acrescimo,
      p_data_pagamento: dataPagamento || new Date().toISOString().split('T')[0]
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

  async getExtrato(filtros: IExtratoFiltros = {}): Promise<IExtratoResponse> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 20; // Extrato can be denser
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryTransacoes = supabase
      .from('fin_transacoes')
      .select(`
        id,
        valor,
        data_pagamento,
        tipo,
        tipo_transacao,
        descricao,
        titulo:fin_titulos(descricao),
        conta_origem:fin_contas_bancarias(banco_nome, conta),
        forma_pagamento:cad_formas_pagamento(nome)
      `, { count: 'exact' });

    if (filtros.dataInicio) queryTransacoes = queryTransacoes.gte('data_pagamento', filtros.dataInicio);
    if (filtros.dataFim) queryTransacoes = queryTransacoes.lte('data_pagamento', filtros.dataFim);

    // Filter by type if provided (optional optimization)
    if (filtros.tipo) queryTransacoes = queryTransacoes.eq('tipo', filtros.tipo);

    const { data: transacoes, error: errT, count } = await queryTransacoes
      .order('data_pagamento', { ascending: false })
      .range(from, to);

    if (errT) throw errT;

    return {
      data: (transacoes || []) as unknown as ITransacao[],
      count: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  },

  async getExtratoTotals(filtros: IExtratoFiltros = {}): Promise<IExtratoTotals> {
    let query = supabase
      .from('fin_transacoes')
      .select('valor, tipo');

    if (filtros.dataInicio) query = query.gte('data_pagamento', filtros.dataInicio);
    if (filtros.dataFim) query = query.lte('data_pagamento', filtros.dataFim);

    // Filter by type if provided (optional optimization)
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);

    const { data, error } = await query;
    if (error) throw error;

    const entradas = (data || []).filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + (t.valor || 0), 0);
    const saidas = (data || []).filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + (t.valor || 0), 0);

    return {
      entradas,
      saidas,
      balanco: entradas - saidas
    };
  },

  async getExtratoPorConta(contaId: string, dataInicio: string, dataFim: string): Promise<{ saldoAnterior: number, transacoes: ITransacao[], saldoFINAL: number }> {
    // 1. Get initial balance from the account
    const { data: conta, error: errC } = await supabase.from('fin_contas_bancarias').select('saldo_inicial').eq('id', contaId).single();
    if (errC) throw errC;
    let saldo = Number(conta?.saldo_inicial || 0);

    // 2. Compute the balance from all past transactions before dataInicio
    const { data: pastTx, error: errP } = await supabase.from('fin_transacoes').select('valor, tipo').eq('conta_origem_id', contaId).lt('data_pagamento', dataInicio)
    if (errP) throw errP;

    if (pastTx) {
      saldo += pastTx.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
      saldo -= pastTx.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    }
    const saldoAnterior = saldo;

    // 3. Get transactions for the specified period, ordered chronologically
    const { data: currentTx, error } = await supabase
      .from('fin_transacoes')
      .select(`
        id, valor, data_pagamento, tipo, tipo_transacao, descricao,
        titulo:fin_titulos(descricao, parceiro:parceiros(nome)),
        forma_pagamento:cad_formas_pagamento(nome)
      `)
      .eq('conta_origem_id', contaId)
      .gte('data_pagamento', dataInicio)
      .lte('data_pagamento', dataFim + 'T23:59:59')
      .order('data_pagamento', { ascending: true })
      .order('created_at', { ascending: true }); // chronological

    if (error) throw error;

    let saldoFINAL = saldoAnterior;
    if (currentTx) {
      saldoFINAL += currentTx.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
      saldoFINAL -= currentTx.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    }

    return {
      saldoAnterior,
      transacoes: (currentTx || []) as unknown as ITransacao[],
      saldoFINAL
    };
  },

  async realizarTransferencia(payload: { origem: string, destino: string, valor: number, obs?: string }): Promise<void> {
    const { error } = await supabase.rpc('salvar_transferencia', {
      p_id: null,
      p_origem_id: payload.origem,
      p_destino_id: payload.destino,
      p_valor: payload.valor,
      p_descricao: payload.obs || 'Transferência Interna',
      p_data: new Date().toISOString().split('T')[0]
    });

    if (error) {
      console.error('Erro ao realizar transferência via RPC:', error);
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

  async getKpis(): Promise<IFinanceiroKpis> {
    const { data, error } = await supabase.rpc('get_financeiro_kpis');
    if (error) {
      console.error('Erro ao buscar KPIs via RPC:', error);
      throw error;
    }
    return data as IFinanceiroKpis;
  },

  async getCategorias(): Promise<ICategoriaFinanceira[]> {
    const { data, error } = await supabase.from('fin_categorias').select('id, nome, tipo, natureza').order('nome');
    if (error) throw error;
    return data as ICategoriaFinanceira[];
  },

  async getContasBancarias(): Promise<IContaBancaria[]> {
    const { data, error } = await supabase
      .from('fin_contas_bancarias')
      .select('*')
      .eq('ativo', true)
      .order('banco_nome');
    if (error) throw error;
    return data as IContaBancaria[];
  },

  async getPendencias(): Promise<IPendencias> {
    const { data, error } = await supabase.rpc('get_financeiro_pendencias');
    if (error) {
      console.error('Erro ao buscar pendências via RPC:', error);
      throw error;
    }
    return data as IPendencias;
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

  // ─── HISTÓRICO GERAL UNIFICADO ─────────────────────────────────────
  // Consolida transações realizadas + títulos pendentes numa visão única

  async getHistoricoGeral(filtros: IHistoricoFiltros = {}): Promise<IHistoricoResponse> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 30;
    const hoje = new Date().toISOString().split('T')[0];

    // ── 1. Buscar TRANSAÇÕES realizadas (entradas, saídas, transferências) ──
    let queryTx = supabase
      .from('fin_transacoes')
      .select(`
        id, valor, data_pagamento, tipo, tipo_transacao, descricao,
        titulo:fin_titulos(id, descricao, pedido_id, tipo, parcela_numero, parcela_total,
          parceiro:parceiros(nome)),
        conta:fin_contas_bancarias(banco_nome),
        forma_pagamento:cad_formas_pagamento(nome)
      `);

    if (filtros.dataInicio) queryTx = queryTx.gte('data_pagamento', filtros.dataInicio);
    if (filtros.dataFim) queryTx = queryTx.lte('data_pagamento', filtros.dataFim + 'T23:59:59');

    if (filtros.tipo === 'ENTRADA') queryTx = queryTx.eq('tipo', 'ENTRADA');
    if (filtros.tipo === 'SAIDA') queryTx = queryTx.eq('tipo', 'SAIDA');
    if (filtros.tipo === 'TRANSFERENCIA') queryTx = queryTx.in('tipo_transacao', ['TRANSFERENCIA_SAIDA', 'TRANSFERENCIA_ENTRADA']);

    const { data: transacoes } = await queryTx.order('data_pagamento', { ascending: false });

    // ── 2. Buscar TÍTULOS pendentes (a pagar e a receber) ──
    let queryTit = supabase
      .from('fin_titulos')
      .select(`
        id, descricao, tipo, status, valor_total, valor_pago,
        data_emissao, data_vencimento, parcela_numero, parcela_total,
        pedido_id, despesa_veiculo_id,
        parceiro:parceiros(nome),
        categoria:fin_categorias(nome, natureza),
        forma_pagamento:cad_formas_pagamento(nome),
        conta_prevista:fin_contas_bancarias(banco_nome)
      `)
      .in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']);

    if (filtros.dataInicio) queryTit = queryTit.gte('data_vencimento', filtros.dataInicio);
    if (filtros.dataFim) queryTit = queryTit.lte('data_vencimento', filtros.dataFim);

    if (filtros.tipo === 'A_PAGAR') queryTit = queryTit.eq('tipo', 'PAGAR');
    if (filtros.tipo === 'A_RECEBER') queryTit = queryTit.eq('tipo', 'RECEBER');

    const { data: titulos } = await queryTit.order('data_vencimento', { ascending: false });

    // ── 3. Se temos pedido_ids, buscar referências de pedidos ──
    const pedidoIds = new Set<string>();
    (transacoes || []).forEach((t: any) => { if (t.titulo?.pedido_id) pedidoIds.add(t.titulo.pedido_id); });
    (titulos || []).forEach((t: any) => { if (t.pedido_id) pedidoIds.add(t.pedido_id); });

    let pedidoRefMap: Record<string, { ref: string; tipo: 'COMPRA' | 'VENDA' }> = {};
    if (pedidoIds.size > 0) {
      const ids = Array.from(pedidoIds);
      const [compras, vendas] = await Promise.all([
        supabase.from('cmp_pedidos').select('id, numero_pedido').in('id', ids),
        supabase.from('venda_pedidos').select('id, numero_venda').in('id', ids)
      ]);
      (compras.data || []).forEach((p: any) => { pedidoRefMap[p.id] = { ref: p.numero_pedido, tipo: 'COMPRA' }; });
      (vendas.data || []).forEach((p: any) => { pedidoRefMap[p.id] = { ref: p.numero_venda, tipo: 'VENDA' }; });
    }

    // ── 4. Mapear transações para IHistoricoUnificado ──
    const mapOrigemTx = (t: any): OrigemHistorico => {
      const tt = t.tipo_transacao || '';
      if (tt === 'SALDO_INICIAL') return 'SALDO_INICIAL';
      if (tt === 'RETIRADA_SOCIO') return 'RETIRADA';
      if (tt.includes('TRANSFERENCIA')) return 'TRANSFERENCIA';
      if (t.titulo?.pedido_id && pedidoRefMap[t.titulo.pedido_id]) return pedidoRefMap[t.titulo.pedido_id].tipo;
      if (tt === 'PAGAMENTO_TITULO') return 'MANUAL';
      if (tt === 'RECEBIMENTO_TITULO') return 'MANUAL';
      return 'MANUAL';
    };

    const historicoTx: IHistoricoUnificado[] = (transacoes || []).map((t: any) => {
      const pedidoId = t.titulo?.pedido_id;
      const pedidoInfo = pedidoId ? pedidoRefMap[pedidoId] : null;
      return {
        id: `tx_${t.id}`,
        data: t.data_pagamento,
        tipo_movimento: t.tipo as any,
        descricao: t.descricao || t.titulo?.descricao || 'Lançamento',
        valor: t.valor || 0,
        status: 'REALIZADO' as StatusHistorico,
        origem: mapOrigemTx(t),
        parceiro_nome: t.titulo?.parceiro?.nome,
        conta_nome: t.conta?.banco_nome,
        forma_pagamento: t.forma_pagamento?.nome,
        parcela_info: t.titulo?.parcela_numero ? `${t.titulo.parcela_numero}/${t.titulo.parcela_total}` : undefined,
        pedido_ref: pedidoInfo?.ref,
        pedido_id: pedidoId,
        titulo_id: t.titulo?.id,
        source: 'TRANSACAO' as const,
      };
    });

    // ── 5. Mapear títulos pendentes para IHistoricoUnificado ──
    const historicoTit: IHistoricoUnificado[] = (titulos || []).map((t: any) => {
      const pedidoInfo = t.pedido_id ? pedidoRefMap[t.pedido_id] : null;
      const isAtrasado = t.data_vencimento < hoje && t.status !== 'PAGO';
      const statusMap: Record<string, StatusHistorico> = {
        'PENDENTE': isAtrasado ? 'ATRASADO' : 'PENDENTE',
        'PARCIAL': 'PARCIAL',
        'ATRASADO': 'ATRASADO',
      };
      const origemTit = (): OrigemHistorico => {
        if (pedidoInfo) return pedidoInfo.tipo;
        if (t.despesa_veiculo_id) return 'DESPESA_VEICULO';
        return 'MANUAL';
      };
      return {
        id: `tit_${t.id}`,
        data: t.data_vencimento,
        data_emissao: t.data_emissao,
        tipo_movimento: (t.tipo === 'PAGAR' ? 'A_PAGAR' : 'A_RECEBER') as any,
        descricao: t.descricao || 'Título financeiro',
        valor: t.valor_total || 0,
        valor_pago: t.valor_pago || 0,
        valor_restante: (t.valor_total || 0) - (t.valor_pago || 0),
        status: statusMap[t.status] || 'PENDENTE',
        origem: origemTit(),
        parceiro_nome: t.parceiro?.nome,
        conta_nome: t.conta_prevista?.banco_nome,
        forma_pagamento: t.forma_pagamento?.nome,
        parcela_info: t.parcela_numero ? `${t.parcela_numero}/${t.parcela_total}` : undefined,
        pedido_ref: pedidoInfo?.ref,
        pedido_id: t.pedido_id,
        titulo_id: t.id,
        source: 'TITULO' as const,
      };
    });

    // ── 6. Unificar, aplicar filtros adicionais, paginar ──
    let unificado = [...historicoTx, ...historicoTit];

    // Filtro por status
    if (filtros.status) {
      unificado = unificado.filter(h => h.status === filtros.status);
    }

    // Filtro por origem
    if (filtros.origem) {
      unificado = unificado.filter(h => h.origem === filtros.origem);
    }

    // Filtro por tipo (caso não tenha sido filtrado na query)
    if (filtros.tipo === 'A_PAGAR') {
      unificado = unificado.filter(h => h.tipo_movimento === 'A_PAGAR');
    } else if (filtros.tipo === 'A_RECEBER') {
      unificado = unificado.filter(h => h.tipo_movimento === 'A_RECEBER');
    } else if (filtros.tipo === 'ENTRADA') {
      unificado = unificado.filter(h => h.tipo_movimento === 'ENTRADA');
    } else if (filtros.tipo === 'SAIDA') {
      unificado = unificado.filter(h => h.tipo_movimento === 'SAIDA');
    }

    // Busca por texto
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      unificado = unificado.filter(h =>
        h.descricao?.toLowerCase().includes(termo) ||
        h.parceiro_nome?.toLowerCase().includes(termo) ||
        h.pedido_ref?.toLowerCase().includes(termo)
      );
    }

    // Ordenar por data desc
    unificado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    const total = unificado.length;
    const from = (page - 1) * limit;
    const paginado = unificado.slice(from, from + limit);

    return {
      data: paginado,
      count: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getHistoricoTotals(filtros: IHistoricoFiltros = {}): Promise<IHistoricoTotals> {
    // ── Transações realizadas ──
    let queryTx = supabase.from('fin_transacoes').select('valor, tipo');
    if (filtros.dataInicio) queryTx = queryTx.gte('data_pagamento', filtros.dataInicio);
    if (filtros.dataFim) queryTx = queryTx.lte('data_pagamento', filtros.dataFim + 'T23:59:59');
    const { data: txData } = await queryTx;

    const entradas = (txData || []).filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + (t.valor || 0), 0);
    const saidas = (txData || []).filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + (t.valor || 0), 0);

    // ── Títulos pendentes ──
    let queryPagar = supabase.from('fin_titulos').select('valor_total, valor_pago').eq('tipo', 'PAGAR').in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']);
    let queryReceber = supabase.from('fin_titulos').select('valor_total, valor_pago').eq('tipo', 'RECEBER').in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO']);

    if (filtros.dataInicio) {
      queryPagar = queryPagar.gte('data_vencimento', filtros.dataInicio);
      queryReceber = queryReceber.gte('data_vencimento', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      queryPagar = queryPagar.lte('data_vencimento', filtros.dataFim);
      queryReceber = queryReceber.lte('data_vencimento', filtros.dataFim);
    }

    const [{ data: pagarData }, { data: receberData }] = await Promise.all([queryPagar, queryReceber]);

    const aPagar = (pagarData || []).reduce((acc, t) => acc + ((t.valor_total || 0) - (t.valor_pago || 0)), 0);
    const aReceber = (receberData || []).reduce((acc, t) => acc + ((t.valor_total || 0) - (t.valor_pago || 0)), 0);

    return {
      entradas_realizadas: entradas,
      saidas_realizadas: saidas,
      a_pagar_pendente: aPagar,
      a_receber_pendente: aReceber,
      saldo_periodo: (entradas + aReceber) - (saidas + aPagar),
    };
  },

  // ─── REALTIME SURGICAL (Seção 5.2) ──────────────────────────────────

  subscribeToTable(table: 'fin_titulos' | 'fin_transacoes' | 'fin_transferencias' | 'fin_retiradas', onUpdate: () => void) {
    return supabase
      .channel(`financeiro_${table}_sync`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table
      }, () => {
        console.log(`[Realtime] Update detected on ${table}`);
        onUpdate();
      })
      .subscribe();
  }
};