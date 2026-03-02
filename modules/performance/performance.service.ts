
import { supabase } from '../../lib/supabase';
import {
  IPerformanceData,
  IPerformanceResumo,
  IPerformanceVenda,
  IPerformanceCompra,
  IPerformanceTitulo,
  IPerformanceDespesaVeiculo,
  IPerformanceRetirada,
  IPerformanceEstoque,
  IPerformanceConta,
  PerformanceResumoSchema,
} from './performance.types';

export const PerformanceService = {
  /**
   * Busca TODOS os dados da empresa para um período (startDate..endDate).
   * 100% das métricas (resumo) calculadas via RPC Senior.
   */
  async getPerformanceData(startDate: string, endDate: string): Promise<IPerformanceData> {
    // 1. Fetch Atomic Metrics from Database (Server-side calculation)
    const { data: resumen, error: rpcError } = await supabase.rpc('get_performance_overview', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (rpcError) {
      console.error('Erro ao buscar performance overview via RPC:', rpcError);
      throw rpcError;
    }

    // Validate resumen with Zod
    const validatedResumo = PerformanceResumoSchema.parse(resumen);

    // 2. Fetch Detailed Lists in Parallel (Optimized)
    const [
      vendas,
      compras,
      titulosPagar,
      titulosReceber,
      despesasVeiculos,
      retiradas,
      estoque,
      contasBancarias,
    ] = await Promise.all([
      this.getVendas(startDate, endDate),
      this.getCompras(startDate, endDate),
      this.getTitulos('PAGAR', startDate, endDate),
      this.getTitulos('RECEBER', startDate, endDate),
      this.getDespesasVeiculos(startDate, endDate),
      this.getRetiradas(startDate, endDate),
      this.getEstoqueAtual(),
      this.getContasBancarias(),
    ]);

    return {
      resumo: validatedResumo as IPerformanceResumo,
      vendas,
      compras,
      titulos_pagar: titulosPagar,
      titulos_receber: titulosReceber,
      despesas_veiculos: despesasVeiculos,
      retiradas,
      estoque,
      contas_bancarias: contasBancarias,
    };
  },

  // ===================== VENDAS =====================
  async getVendas(startDate: string, endDate: string): Promise<IPerformanceVenda[]> {
    const { data } = await supabase
      .from('venda_pedidos')
      .select(`
        id, numero_venda, data_venda, valor_venda, status,
        cliente:parceiros(nome),
        veiculo:est_veiculos(placa, valor_custo, valor_custo_servicos, modelo:cad_modelos(nome))
      `)
      .eq('status', 'CONCLUIDO')
      .gte('data_venda', startDate)
      .lte('data_venda', endDate)
      .order('data_venda', { ascending: false });

    return (data || []).map((s: any) => {
      const custoVeiculo = Number(s.veiculo?.valor_custo) || 0;
      const custoServicos = Number(s.veiculo?.valor_custo_servicos) || 0;
      const custoTotal = custoVeiculo + custoServicos;
      const lucro = (Number(s.valor_venda) || 0) - custoTotal;
      const margem = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

      return {
        id: s.id,
        numero_venda: s.numero_venda,
        data_venda: s.data_venda,
        cliente_nome: s.cliente?.nome || 'Consumidor Final',
        veiculo_modelo: s.veiculo?.modelo?.nome || 'N/A',
        veiculo_placa: s.veiculo?.placa || 'N/A',
        valor_venda: Number(s.valor_venda) || 0,
        custo_veiculo: custoVeiculo,
        custo_servicos: custoServicos,
        lucro_bruto: lucro,
        margem_percent: margem
      };
    });
  },

  // ===================== COMPRAS =====================
  async getCompras(startDate: string, endDate: string): Promise<IPerformanceCompra[]> {
    const { data } = await supabase
      .from('cmp_pedidos')
      .select(`
        id, numero_pedido, data_compra, valor_negociado,
        fornecedor:parceiros(nome),
        veiculos:est_veiculos!est_veiculos_pedido_id_fkey(placa, modelo:cad_modelos(nome))
      `)
      .eq('status', 'CONCLUIDO')
      .gte('data_compra', startDate)
      .lte('data_compra', endDate)
      .order('data_compra', { ascending: false });

    return (data || []).map((p: any) => ({
      id: p.id,
      numero_pedido: p.numero_pedido || 'N/A',
      data_compra: p.data_compra,
      fornecedor_nome: p.fornecedor?.nome || 'N/A',
      veiculo_modelo: p.veiculos?.[0]?.modelo?.nome || 'Lote',
      veiculo_placa: p.veiculos?.[0]?.placa || 'Lote',
      valor_negociado: Number(p.valor_negociado) || 0
    }));
  },

  // ===================== TÍTULOS =====================
  async getTitulos(tipo: 'PAGAR' | 'RECEBER', startDate: string, endDate: string): Promise<IPerformanceTitulo[]> {
    const { data } = await supabase
      .from('fin_titulos')
      .select(`
        id, tipo, descricao, valor_total, valor_pago, data_vencimento, status,
        parceiro:parceiros(nome),
        categoria:fin_categorias(nome)
      `)
      .eq('tipo', tipo)
      .gte('data_vencimento', startDate)
      .lte('data_vencimento', endDate)
      .order('data_vencimento', { ascending: true });

    return (data || []).map((t: any) => ({
      id: t.id,
      tipo: t.tipo,
      descricao: t.descricao,
      valor_total: Number(t.valor_total) || 0,
      valor_pago: Number(t.valor_pago) || 0,
      data_vencimento: t.data_vencimento,
      status: t.status,
      parceiro_nome: t.parceiro?.nome || 'N/A',
      categoria_nome: t.categoria?.nome || 'Outros'
    }));
  },

  // ===================== DESPESAS VEÍCULOS =====================
  async getDespesasVeiculos(startDate: string, endDate: string): Promise<IPerformanceDespesaVeiculo[]> {
    const { data } = await supabase
      .from('est_veiculos_despesas')
      .select(`
        id, descricao, valor_total, data, status_pagamento,
        veiculo:est_veiculos(placa, modelo:cad_modelos(nome))
      `)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });

    return (data || []).map((d: any) => ({
      id: d.id,
      veiculo_modelo: d.veiculo?.modelo?.nome || 'Geral',
      veiculo_placa: d.veiculo?.placa || 'Geral',
      descricao: d.descricao,
      valor_total: Number(d.valor_total) || 0,
      data: d.data,
      status_pagamento: d.status_pagamento
    }));
  },

  // ===================== RETIRADAS =====================
  async getRetiradas(startDate: string, endDate: string): Promise<IPerformanceRetirada[]> {
    const { data } = await supabase
      .from('fin_transacoes')
      .select(`
        id, valor, data_pagamento, descricao,
        socio:parceiros(nome)
      `)
      .eq('categoria_id', 'RETIRADA_SOCIO') // Ajustar ID se necessário
      .gte('data_pagamento', startDate)
      .lte('data_pagamento', endDate)
      .order('data_pagamento', { ascending: false });

    return (data || []).map((r: any) => ({
      id: r.id,
      socio_nome: r.socio?.nome || 'N/A',
      valor: Number(r.valor) || 0,
      data: r.data_pagamento,
      tipo: 'RETIRADA',
      descricao: r.descricao
    }));
  },

  // ===================== ESTOQUE ATUAL =====================
  async getEstoqueAtual(): Promise<IPerformanceEstoque[]> {
    const { data } = await supabase
      .from('est_veiculos')
      .select(`
        id, valor_custo, valor_custo_servicos, valor_venda, status, created_at, placa,
        modelo:cad_modelos(nome)
      `)
      .in('status', ['DISPONIVEL', 'PREPARACAO', 'RESERVADO'])
      .order('created_at', { ascending: true });

    return (data || []).map((v: any) => {
      const custo = (Number(v.valor_custo) || 0) + (Number(v.valor_custo_servicos) || 0);
      const venda = Number(v.valor_venda) || 0;
      const margem = custo > 0 ? ((venda - custo) / custo) * 100 : 0;
      const dias = Math.floor((new Date().getTime() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: v.id,
        modelo: v.modelo?.nome || 'N/A',
        placa: v.placa || 'N/A',
        valor_custo: Number(v.valor_custo) || 0,
        valor_custo_servicos: Number(v.valor_custo_servicos) || 0,
        valor_venda: venda,
        margem_percent: margem,
        dias_estoque: dias,
        status: v.status
      };
    });
  },

  // ===================== CONTAS BANCÁRIAS =====================
  async getContasBancarias(): Promise<IPerformanceConta[]> {
    const { data } = await supabase
      .from('fin_contas_bancarias')
      .select('id, banco_nome, tipo, saldo_atual')
      .order('banco_nome');

    return (data || []).map((c: any) => ({
      id: c.id,
      banco_nome: c.banco_nome || 'N/A',
      tipo: c.tipo || 'N/A',
      saldo_atual: Number(c.saldo_atual) || 0
    }));
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('performance_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venda_pedidos' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cmp_pedidos' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_titulos' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'est_veiculos' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'est_veiculos_despesas' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_transacoes' }, () => {
        onUpdate();
      })
      .subscribe();
  },

  unsubscribe(channel: any) {
    if (channel) supabase.removeChannel(channel);
  }
};
