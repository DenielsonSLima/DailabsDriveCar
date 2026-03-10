import { supabase } from '../../lib/supabase';
import { PerformanceResumoSchema } from '../performance/performance.types';
import { ICaixaDashboardData, ISocioStockStats, IForecastMes, IComparativoMensal, CaixaDashboardSchema, IPendingAccount } from './caixa.types';
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

    // --- LÓGICA DE LUCRO REAL (SÓCIO) ---
    // 1. Dinheiro em Caixa (Realizado): O que já sobrou após cobrir o custo dos veículos que saíram.
    // (Total Entradas - Custo dos Veículos Vendidos)
    const totalEntradas = validatedMetrics.total_entradas || 0; // Keep this line
    const totalVendasRecebido = validatedMetrics.total_vendas_recebido || 0; // Keep this line
    const custoVendas = validatedMetrics.total_custo_vendas || 0;
    const lucroRealizadoTotal = Math.max(0, totalEntradas - custoVendas);

    // 2. Lucro a Receber (Futuro): Todo o Contas a Receber, removendo a parte que é apenas retorno de custo.
    // Se o custo ainda não foi totalmente pago pelo que recebemos de vendas, subtraímos do que temos a receber.
    const totalRecebiveis = validatedMetrics.total_recebiveis || 0;
    const custoPendenteDeRecuperar = Math.max(0, custoVendas - totalVendasRecebido);
    const lucroPendenteTotal = Math.max(0, totalRecebiveis - custoPendenteDeRecuperar);

    // 3. Lucro Gerado (Competência): Soma do Lucro no Bolso + Lucro Garantido para o futuro.
    // Isso inclui automaticamente Lucro de Vendas + Outros Créditos (Recebidos e a Receber).
    const totalLucroGerado = lucroRealizadoTotal + lucroPendenteTotal;

    const processedSocios = (investimentoSocios as any[] || []).map(s => ({
      ...s,
      lucro_periodo: totalLucroGerado / 3,
      lucro_caixa: lucroRealizadoTotal / 3,
      lucro_pendente: lucroPendenteTotal / 3,
    })).sort((a, b) => b.valor_investido - a.valor_investido);

    // Enriquecer veículos com detalhes técnicos (Imersivo)
    const allVehicleIds = Array.from(new Set(
      processedSocios.flatMap(s => (s.veiculos || []).map((v: any) => v.id))
    ));

    // 4. Fetch all automaker logos for name-based fallback (Robustness)
    const { data: allMontadoras } = await supabase
      .from('cad_montadoras')
      .select('nome, logo_url');

    const logoLookup = new Map<string, string>();
    (allMontadoras || []).forEach(m => {
      if (m.nome && m.logo_url) {
        const normalized = m.nome.toUpperCase().trim();
        logoLookup.set(normalized, m.logo_url);

        // Aliases comuns para garantir cobertura total
        if (normalized === 'VOLKSWAGEN') logoLookup.set('VOLKSVAGEM', m.logo_url);
        if (normalized === 'VOLKSVAGEM') logoLookup.set('VOLKSWAGEN', m.logo_url);
        if (normalized === 'CHEVROLET') logoLookup.set('GM', m.logo_url);
      }
    });

    if (allVehicleIds.length > 0) {
      const { data: vehicleDetails } = await supabase
        .from('est_veiculos')
        .select(`
          id,
          motorizacao,
          transmissao,
          combustivel,
          ano_modelo,
          ano_fabricacao,
          valor_custo,
          valor_custo_servicos,
          versao:cad_versoes(nome),
          montadora:cad_montadoras(logo_url)
        `)
        .in('id', allVehicleIds);

      if (vehicleDetails) {
        const discoveredLogos = new Map<string, string>();

        processedSocios.forEach(s => {
          if (s.veiculos) {
            s.veiculos = s.veiculos.map((v: any) => {
              const detail = vehicleDetails.find(d => d.id === v.id);
              if (detail) {
                // Discover logo from direct DB relationship
                let logo = Array.isArray(detail.montadora) ? detail.montadora[0]?.logo_url : (detail.montadora as any)?.logo_url;
                const brand = (v.montadora || '').toUpperCase().trim();
                if (logo) discoveredLogos.set(brand, logo);

                return {
                  ...v,
                  motorizacao: detail.motorizacao,
                  cambio: detail.transmissao,
                  combustivel: detail.combustivel,
                  ano_modelo: detail.ano_modelo,
                  ano_fabricacao: detail.ano_fabricacao,
                  valor_total_custo: (Number(detail.valor_custo) || 0) + (Number(detail.valor_custo_servicos) || 0),
                  versao: Array.isArray(detail.versao) ? detail.versao[0]?.nome : (detail.versao as any)?.nome || v.versao,
                  montadora_logo: logo
                };
              }
              return { ...v, _isOrphan: true };
            });
          }
        });

        // PASS 2: Self-Healing & Fallbacks
        processedSocios.forEach(s => {
          if (s.veiculos) {
            s.veiculos = s.veiculos.map((v: any) => {
              if (v._isOrphan) return v;
              if (v.montadora_logo) return v; // Keep existing logo if found

              const brand = (v.montadora || '').toUpperCase().trim();
              const model = (v.modelo || '').toUpperCase().trim();

              // 1. Re-use logo discovered from another vehicle in the SAME list
              let logo = discoveredLogos.get(brand);

              // 2. Fuzzy match against discovered logos
              if (!logo && brand) {
                for (const [name, url] of discoveredLogos.entries()) {
                  if (name.includes(brand) || brand.includes(name)) { logo = url; break; }
                }
              }

              // 3. Fallback to global logoLookup (from cad_montadoras)
              if (!logo) logo = logoLookup.get(brand);

              // 4. Model-based fallback (Requested by user)
              if (!logo && model) {
                if (model.includes('CRETA')) logo = logoLookup.get('HYUNDAI');
                else if (model.includes('TORO') || model.includes('CRONOS')) logo = logoLookup.get('FIAT');
                else if (model.includes('NIVUS') || model.includes('VIRTUS')) logo = logoLookup.get('VOLKSWAGEN') || logoLookup.get('VOLKSVAGEM');
                else if (model.includes('ONIX') || model.includes('TRACKER')) logo = logoLookup.get('CHEVROLET');
              }

              return { ...v, montadora_logo: logo };
            }).filter((v: any) => !v._isOrphan);
          }
        });
      }
    }

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

  async getPerformanceHistory(selectedMonth: string): Promise<any[]> {
    const [year, month] = selectedMonth.split('-').map(Number);

    // Busca os dados dos últimos 3 meses em paralelo
    const promises = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date(year, month - 1 - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const label = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase() + '/' + date.getFullYear().toString().slice(-2);

      // Chamada paralela aos dois RPCs para ter visão completa (VGV da Performance e Despesas Operacionais do Caixa)
      promises.push(
        Promise.all([
          supabase.rpc('get_performance_overview', { p_start_date: start, p_end_date: end }),
          supabase.rpc('get_caixa_metrics', { p_data_inicio: start, p_data_fim: end })
        ]).then(([perfRes, caixaRes]) => {
          const p = Array.isArray(perfRes.data) ? perfRes.data[0] : perfRes.data;
          const c = Array.isArray(caixaRes.data) ? caixaRes.data[0] : caixaRes.data;

          const perfValid = PerformanceResumoSchema.parse(p || {});
          const caixaValid = CaixaDashboardSchema.parse(c || {});

          // Faturado e Lucro Bruto vêm da Performance (melhor para VGV)
          const faturado = perfValid.total_vendas_valor;
          const lucro = perfValid.lucro_bruto;

          const fixas = (caixaValid.total_despesas_fixas || 0);
          const variaveis = (caixaValid.total_despesas_variaveis || 0) + (perfValid.despesas_veiculos || 0);

          // Custo calculado para fechar com o lucro bruto mostrado no sistema
          const custo = faturado > 0 ? (faturado - lucro) : 0;

          return {
            label,
            faturado,
            custo,
            despesas_fixas: fixas,
            despesas_variaveis: variaveis,
            despesas: fixas + variaveis,
            lucro
          };
        })
      );
    }

    return Promise.all(promises);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_retiradas' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_transferencias' }, () => {
        onUpdate();
      })
      .subscribe();
  },

  unsubscribe(channel: any) {
    if (channel) supabase.removeChannel(channel);
  },

  async getContasPendentes(p_data_inicio: string, p_data_fim: string): Promise<IPendingAccount[]> {
    const { data, error } = await supabase
      .from('fin_titulos')
      .select(`
        id,
        tipo,
        descricao,
        data_vencimento,
        valor_total,
        valor_pago,
        valor_desconto,
        valor_acrescimo,
        status,
        veiculo_id,
        veiculo:est_veiculos(placa, modelo:cad_modelos(nome))
      `)
      .in('status', ['PENDENTE', 'PARCIAL', 'ATRASADO'])
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error('Erro ao buscar contas pendentes:', error);
      throw error;
    }

    return (data || []).map((t: any) => {
      const v = Array.isArray(t.veiculo) ? t.veiculo[0] : t.veiculo;
      return {
        ...t,
        veiculo: v ? {
          placa: v.placa,
          modelo: v.modelo?.nome || 'N/A'
        } : undefined
      };
    });
  }
};
