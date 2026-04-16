import { supabase } from '../../../lib/supabase';

export interface VeiculoConsultaReponse {
  user: {
    first_name: string;
    email: string;
    cellphone: string;
    notification: string;
  };
  balance: string;
  error: boolean;
  message: string;
  tax: string;
  valor_consulta: number;
  api_limit_for: string;
  homolog: boolean;
  data: {
    resultados: {
      anoFabricacao: number;
      anoModelo: string;
      categoria: string;
      chassi: string;
      codigoFipe: string;
      combustivel: string;
      cor: string;
      extra: any;
      historico: {
        mes: string;
        valor: number;
      }[];
      marca: string;
      mesReferencia: string;
      modelo: string;
      principal: boolean;
      url: string;
      valor: number;
    }[];
  };
}

export interface FipeUsageStats {
  used: number;
  limit: number;
  remaining: number;
}

export const consultaPlacaService = {
  /**
   * Obtém as estatísticas de uso da organização atual
   */
  async fetchUsageStats(): Promise<FipeUsageStats> {
    const { data, error } = await supabase.rpc('rpc_get_fipe_usage_stats');
    if (error) {
      console.error('Erro ao buscar estatísticas de Fipe:', error);
      return { used: 0, limit: 100, remaining: 100 };
    }
    return data as FipeUsageStats;
  },

  async consultar(placa: string): Promise<VeiculoConsultaReponse> {
    const limpaPlaca = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const token = import.meta.env.VITE_APIBRASIL_BEARER_TOKEN;

    if (!token) {
      throw new Error('Token da API Brasil não configurado. Verifique a variável VITE_APIBRASIL_BEARER_TOKEN.');
    }

    try {
      // 1. Verificar Cache Global no Banco de Dados
      const { data: cachedRow, error: cacheError } = await supabase
        .from('fipe_api_cache')
        .select('dados_json, mes_referencia, updated_at')
        .eq('placa', limpaPlaca)
        .maybeSingle();

      const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
      
      // Se existe no cache e é do mês atual, usamos o cache (Economia Total)
      if (cachedRow && cachedRow.mes_referencia.toLowerCase() === mesAtual.toLowerCase()) {
        console.log('FIPE: Carregando do Cache Global para placa:', limpaPlaca);
        
        // Registrar uso (mesmo sendo cache, registramos para o contador da loja)
        await supabase.rpc('rpc_record_fipe_usage', {
          p_placa: limpaPlaca,
          p_cached: true
        });

        return cachedRow.dados_json as VeiculoConsultaReponse;
      }

      // 2. Tentar autorizar e registrar uso real/novo
      const { data: authorized, error: authError } = await supabase.rpc('rpc_record_fipe_usage', {
        p_placa: limpaPlaca,
        p_cached: false
      });

      if (authError || !authorized) {
        throw new Error('LIMITE_MENSAL_ATINGIDO');
      }

      // 3. Consulta Real na API Brasil
      const response = await fetch('https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo: 'fipe-chassi',
          placa: limpaPlaca,
          homolog: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na API Brasil:', errorData);

        if (response.status === 402 || (errorData.message && errorData.message.toLowerCase().includes('saldo'))) {
          throw new Error('SALDO_SISTEMA_INSUFICIENTE');
        }
        throw new Error(errorData.message || 'Falha ao consultar a placa na API Brasil.');
      }

      const apiData: VeiculoConsultaReponse = await response.json();
      
      if (apiData.error) {
        throw new Error(apiData.message || 'A API retornou erro para esta consulta.');
      }

      // 4. Salvar no Cache Global para outras lojas aproveitarem
      if (apiData.data?.resultados?.[0]) {
        const result = apiData.data.resultados[0];
        await supabase.from('fipe_api_cache').upsert({
          placa: limpaPlaca,
          dados_json: apiData,
          mes_referencia: result.mesReferencia || mesAtual,
          updated_at: new Date().toISOString()
        });
      }

      return apiData;
    } catch (error: any) {
      console.error('Erro no consultaPlacaService:', error);
      
      // Mapeamento de erros amigáveis
      if (error.message === 'LIMITE_MENSAL_ATINGIDO') {
        throw new Error('Você atingiu o limite de 100 consultas mensais da sua loja.');
      }
      if (error.message === 'SALDO_SISTEMA_INSUFICIENTE') {
        throw new Error('O sistema está em manutenção de saldo. Tente novamente mais tarde.');
      }

      throw error;
    }
  }
};
