
import { supabase } from '../../lib/supabase';
import { IDashboardStats, IHistoryData } from './inicio.types';

export const InicioService = {
  async getDashboardStats(): Promise<IDashboardStats> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // Busca dados em paralelo
    const [veiculosRes, parceirosRes, vendasRes] = await Promise.all([
      // 1. Veículos disponíveis e valor total
      supabase
        .from('est_veiculos')
        .select('valor_venda')
        .eq('status', 'DISPONIVEL'),

      // 2. Total de parceiros
      supabase
        .from('parceiros')
        .select('*', { count: 'exact', head: true }),

      // 3. Vendas do mês (Concluídas)
      supabase
        .from('venda_pedidos')
        .select(`
          valor_venda,
          veiculo:est_veiculos(valor_custo)
        `)
        .eq('status', 'CONCLUIDO')
        .gte('data_venda', firstDay)
        .lte('data_venda', `${lastDay}T23:59:59`)
    ]);

    const valorGlobal = (veiculosRes.data || []).reduce((acc, v) => acc + (v.valor_venda || 0), 0);

    // Calcular lucro: Somatória (valor_venda - valor_custo)
    const vendas = vendasRes.data || [];
    const lucro = vendas.reduce((acc: number, venda: any) => {
      const custo = venda.veiculo?.valor_custo || 0;
      const receita = venda.valor_venda || 0;
      return acc + (receita - custo);
    }, 0);

    return {
      totalEstoque: veiculosRes.data?.length || 0,
      valorGlobalEstoque: valorGlobal,
      totalParceiros: parceirosRes.count || 0,
      vendasMesAtual: vendas.length,
      lucroProjetado: lucro
    };
  },

  async getRecentArrivals() {
    // Carrega apenas o necessário para o dashboard inicial, otimizando o peso da query
    const { data } = await supabase
      .from('est_veiculos')
      .select(`
        id, 
        placa, 
        valor_venda,
        ano_fabricacao,
        ano_modelo,
        km,
        montadora:cad_montadoras(nome, logo_url), 
        modelo:cad_modelos(nome),
        versao:cad_versoes(nome),
        fotos
      `)
      .eq('status', 'DISPONIVEL')
      .order('created_at', { ascending: false })
      .limit(3);

    return data || [];
  },

  async getHistoryData(months: number = 12): Promise<IHistoryData[]> {
    const { data, error } = await supabase.rpc('get_dashboard_history', {
      p_months_count: months
    });

    if (error) {
      console.error('Erro ao buscar histórico do dashboard:', error);
      throw error;
    }

    return data || [];
  },

  subscribe(callback: () => void) {
    return supabase
      .channel('inicio_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'est_veiculos' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venda_pedidos' }, callback)
      .subscribe();
  }
};
