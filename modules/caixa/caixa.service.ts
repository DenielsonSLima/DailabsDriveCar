
import { supabase } from '../../lib/supabase';
import { ICaixaDashboardData, ISocioStockStats, IForecastMes, IComparativoMensal, CaixaDashboardSchema } from './caixa.types';
import { FinanceiroService } from '../financeiro/financeiro.service';

export const CaixaService = {
  async getDashboardData(p_data_inicio: string, p_data_fim: string): Promise<ICaixaDashboardData> {
    const firstDay = p_data_inicio;
    const lastDay = p_data_fim;

    // 1. Parallelize data fetching: Metrics, Banking accounts, and Partner Patrimony (SQL)
    const [
      { data: metrics, error: metricsError },
      { data: contas },
      { data: investimentoSocios, error: sociosError },
    ] = await Promise.all([
      supabase.rpc('get_caixa_metrics', { p_data_inicio: firstDay, p_data_fim: lastDay }),
      supabase.from('fin_contas_bancarias').select('*').order('banco_nome'),
      supabase.rpc('get_caixa_patrimonio_socios', { p_data_inicio: firstDay, p_data_fim: lastDay })
    ]);

    if (metricsError) {
      console.error('Erro ao buscar métricas do caixa via RPC:', metricsError);
      throw metricsError;
    }

    if (sociosError) {
      console.error('Erro ao buscar patrimônio dos sócios via RPC:', sociosError);
      throw sociosError;
    }

    const metricsPayload = Array.isArray(metrics) ? metrics[0] : metrics;

    if (!metricsPayload) {
      console.warn('RPC get_caixa_metrics retornou vazio. Usando valores zerados.');
    }

    // Validate metrics with Zod
    const validatedMetrics = CaixaDashboardSchema.parse(metricsPayload || {});

    const totalAtivos = (validatedMetrics as any).total_ativos_estoque || 0;

    // Post-process partners to add percentage of total stock
    const processedSocios = (investimentoSocios as any[] || []).map(s => ({
      ...s,
      porcentagem_estoque: totalAtivos > 0 ? (Number(s.valor_investido) / totalAtivos) * 100 : 0
    })).sort((a, b) => b.valor_investido - a.valor_investido);

    return {
      ...(validatedMetrics as any),
      contas: (contas || []) as any,
      investimento_socios: processedSocios,
      transacoes: (await FinanceiroService.getExtrato({ dataInicio: firstDay, dataFim: lastDay })).data
    } as ICaixaDashboardData;
  },

  /**
   * Busca previsão financeira dos próximos 4 meses
   * baseado em títulos a pagar e receber com vencimento futuro
   */
  async getForecast(): Promise<IForecastMes[]> {
    const now = new Date();
    const meses: IForecastMes[] = [];

    // Gerar os 4 meses futuros
    for (let i = 1; i <= 4; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString();
      const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const nomeMes = targetDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      const nomeCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

      meses.push({
        mes: `${nomeCapitalizado}/${targetDate.getFullYear()}`,
        mesNum: targetDate.getMonth(),
        ano: targetDate.getFullYear(),
        contas_pagar: 0,
        contas_receber: 0,
        lucro_projetado: 0,
        _firstDay: firstDay,
        _lastDay: lastDay
      } as any);
    }

    // Buscar todos os títulos em aberto com vencimento nos próximos 4 meses
    const primeiroDia = (meses[0] as any)._firstDay;
    const ultimoDia = (meses[meses.length - 1] as any)._lastDay;

    const [{ data: titulosPagar }, { data: titulosReceber }] = await Promise.all([
      supabase.from('fin_titulos')
        .select('valor_total, valor_pago, data_vencimento')
        .eq('tipo', 'PAGAR')
        .neq('status', 'PAGO')
        .neq('status', 'CANCELADO')
        .gte('data_vencimento', primeiroDia)
        .lte('data_vencimento', ultimoDia),
      supabase.from('fin_titulos')
        .select('valor_total, valor_pago, data_vencimento')
        .eq('tipo', 'RECEBER')
        .neq('status', 'PAGO')
        .neq('status', 'CANCELADO')
        .gte('data_vencimento', primeiroDia)
        .lte('data_vencimento', ultimoDia),
    ]);

    // Distribuir títulos por mês
    (titulosPagar || []).forEach((t: any) => {
      const venc = new Date(t.data_vencimento);
      const saldo = (Number(t.valor_total) || 0) - (Number(t.valor_pago) || 0);
      const mesIdx = meses.findIndex(m => m.mesNum === venc.getMonth() && m.ano === venc.getFullYear());
      if (mesIdx >= 0) meses[mesIdx].contas_pagar += saldo;
    });

    (titulosReceber || []).forEach((t: any) => {
      const venc = new Date(t.data_vencimento);
      const saldo = (Number(t.valor_total) || 0) - (Number(t.valor_pago) || 0);
      const mesIdx = meses.findIndex(m => m.mesNum === venc.getMonth() && m.ano === venc.getFullYear());
      if (mesIdx >= 0) meses[mesIdx].contas_receber += saldo;
    });

    // Calcular lucro projetado
    meses.forEach(m => {
      m.lucro_projetado = m.contas_receber - m.contas_pagar;
      // limpar campos internos
      delete (m as any)._firstDay;
      delete (m as any)._lastDay;
    });

    return meses;
  },

  async getAvailableMonths(): Promise<string[]> {
    const { data, error } = await supabase.rpc('get_caixa_available_months');

    if (error) {
      console.error('Erro ao buscar meses disponíveis:', error);
      // Fallback for safety: return current month
      const now = new Date();
      return [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`];
    }

    return (data as any[]).map(d => d.mes);
  },

  async getComparativoMensal(p_data_inicio: string, p_data_fim: string): Promise<IComparativoMensal> {
    const { data, error } = await supabase.rpc('get_caixa_comparativo_mensal', {
      p_data_inicio,
      p_data_fim,
    });

    if (error) {
      console.error('Erro ao buscar comparativo mensal:', error);
      throw error;
    }

    const payload = Array.isArray(data) ? data[0] : data;

    const defaultMes = { compras: 0, estoque: 0, despesas_veiculo: 0, despesas_fixas: 0, despesas_variaveis: 0, lucro: 0 };

    return {
      mes_atual: { ...defaultMes, ...(payload?.mes_atual || {}) },
      mes_anterior: { ...defaultMes, ...(payload?.mes_anterior || {}) },
    };
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('caixa_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_transacoes' }, () => {
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
      .subscribe();
  },

  unsubscribe(channel: any) {
    if (channel) supabase.removeChannel(channel);
  }
};
