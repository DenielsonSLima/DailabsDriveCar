
import { supabase } from '../../lib/supabase';
import { 
  IDashboardStats, 
  IHistoryData, 
  ISiteAnalyticsSummary, 
  ITopViewedVehicle, 
  IVisitorLocation 
} from './inicio.types';

export const InicioService = {
  async getDashboardStats(): Promise<IDashboardStats> {
    const { data, error } = await supabase.rpc('get_inicio_dashboard_stats');

    if (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      // Fallback para evitar quebra total da UI
      return {
        totalEstoque: 0,
        valorGlobalEstoque: 0,
        totalParceiros: 0,
        vendasMesAtual: 0,
        lucroProjetado: 0,
        lucroRealizado: 0
      };
    }
    
    return {
      totalEstoque: data.totalEstoque || 0,
      valorGlobalEstoque: data.valorGlobalEstoque || 0,
      totalParceiros: data.totalParceiros || 0,
      vendasMesAtual: data.vendasMesAtual || 0,
      lucroProjetado: data.lucroProjetado || 0,
      lucroRealizado: data.lucroRealizado || 0
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

  /**
   * Métodos de Analytics do Site Público
   */

  async getSiteAnalyticsSummary(orgId: string): Promise<ISiteAnalyticsSummary> {
    const { data, error } = await supabase
      .from('view_site_analytics_summary')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar resumo de analytics:', error);
      return { total_views: 0, unique_visitors: 0, views_today: 0 };
    }

    return data || { total_views: 0, unique_visitors: 0, views_today: 0 };
  },

  async getTopViewedVehicles(orgId: string, limit: number = 5): Promise<ITopViewedVehicle[]> {
    const { data, error } = await supabase.rpc('get_top_viewed_vehicles', {
      p_org_id: orgId,
      p_limit: limit
    });

    if (error) {
      console.error('Erro ao buscar veículos mais vistos:', error);
      return [];
    }

    return data || [];
  },

  async getVisitorLocations(orgId: string, limit: number = 10): Promise<IVisitorLocation[]> {
    const { data, error } = await supabase.rpc('get_visitor_locations', {
      p_org_id: orgId,
      p_limit: limit
    });

    if (error) {
      console.error('Erro ao buscar localizações dos visitantes:', error);
      return [];
    }

    return data || [];
  },

  subscribe(callback: () => void) {
    return supabase
      .channel('inicio_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'est_veiculos' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venda_pedidos' }, callback)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'site_analytics' }, callback)
      .subscribe();
  }
};
