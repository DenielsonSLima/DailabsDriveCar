import { supabase } from '../../../lib/supabase';
import { IHistoricoFiltros, IHistoricoResponse, IHistoricoTotals, IHistoricoUnificado, OrigemHistorico, StatusHistorico } from '../financeiro.types';

export const HistoricoService = {
  async getHistoricoGeral(filtros: IHistoricoFiltros = {}): Promise<IHistoricoResponse> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 30;
    const hoje = new Date().toISOString().split('T')[0];

    // ── 1. Buscar TRANSAÇÕES realizadas (entradas, saídas, transferências) ──
    let queryTx = supabase
      .from('fin_transacoes')
      .select(`
        id, valor, data_pagamento, tipo, tipo_transacao, descricao,
        titulo:fin_titulos(id, descricao, pedido_id, tipo, parcela_numero, parcela_total, status, parceiro:parceiros(nome)),
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
      if (tt === 'PAGAMENTO_TITULO' || tt === 'RECEBIMENTO_TITULO') return 'MANUAL';
      return 'MANUAL';
    };

    const historicoTx: IHistoricoUnificado[] = (transacoes || [])
      .filter((t: any) => t.tipo_transacao !== 'ESTORNO' && t.titulo?.status !== 'CANCELADO')
      .map((t: any) => {
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

    if (filtros.status) unificado = unificado.filter(h => h.status === filtros.status);
    if (filtros.origem) unificado = unificado.filter(h => h.origem === filtros.origem);
    
    if (filtros.tipo === 'A_PAGAR') unificado = unificado.filter(h => h.tipo_movimento === 'A_PAGAR');
    else if (filtros.tipo === 'A_RECEBER') unificado = unificado.filter(h => h.tipo_movimento === 'A_RECEBER');
    else if (filtros.tipo === 'ENTRADA') unificado = unificado.filter(h => h.tipo_movimento === 'ENTRADA');
    else if (filtros.tipo === 'SAIDA') unificado = unificado.filter(h => h.tipo_movimento === 'SAIDA');

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      unificado = unificado.filter(h =>
        h.descricao?.toLowerCase().includes(termo) ||
        h.parceiro_nome?.toLowerCase().includes(termo) ||
        h.pedido_ref?.toLowerCase().includes(termo)
      );
    }

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
    let queryTx = supabase.from('fin_transacoes').select('valor, tipo, tipo_transacao, titulo:fin_titulos(status)');
    if (filtros.dataInicio) queryTx = queryTx.gte('data_pagamento', filtros.dataInicio);
    if (filtros.dataFim) queryTx = queryTx.lte('data_pagamento', filtros.dataFim + 'T23:59:59');
    const { data: txData } = await queryTx;

    const filteredTx = (txData || []).filter(t => t.tipo_transacao !== 'ESTORNO' && (t as any).titulo?.status !== 'CANCELADO');

    const entradas = filteredTx.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + (t.valor || 0), 0);
    const saidas = filteredTx.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + (t.valor || 0), 0);

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
  }
};
