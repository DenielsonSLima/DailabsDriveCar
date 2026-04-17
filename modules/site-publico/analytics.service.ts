import { supabase } from '../../lib/supabase';

export interface ITrackVisitParams {
  organization_id: string;
  page_path: string;
  vehicle_id?: string;
}

export const AnalyticsService = {
  /**
   * Obtém ou gera um ID anônimo para o visitante usando API nativa do navegador
   */
  getViewerId(): string {
    let viewerId = localStorage.getItem('site_viewer_id');
    if (!viewerId) {
      // Usa a API nativa de criptografia do navegador para gerar o UUID v4
      viewerId = crypto.randomUUID();
      localStorage.setItem('site_viewer_id', viewerId);
    }
    return viewerId;
  },

  /**
   * Detecta o tipo de dispositivo de forma simples
   */
  getDeviceType(): 'mobile' | 'desktop' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'mobile'; 
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  },

  /**
   * Busca localização básica do visitante via IP (GeoIP)
   */
  async getLocationData() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Falha ao buscar localização');
      const data = await response.json();
      return {
        city: data.city,
        region: data.region,
      };
    } catch (err) {
      console.warn('Não foi possível obter a localização do visitante:', err);
      return { city: null, region: null };
    }
  },

  /**
   * Registra uma visita ao site ou veículo específico
   */
  async trackVisit({ organization_id, page_path, vehicle_id }: ITrackVisitParams) {
    try {
      const viewer_id = this.getViewerId();
      const device_type = this.getDeviceType();
      const location = await this.getLocationData();

      const { error } = await supabase
        .from('site_analytics')
        .insert({
          organization_id,
          page_path,
          vehicle_id,
          viewer_id,
          city: location.city,
          region: location.region,
          device_type,
          user_agent: navigator.userAgent
        });

      if (error) throw error;
    } catch (err) {
      // Falhas no analytics não devem quebrar a experiência do usuário
      console.error('Erro ao registrar visita:', err);
    }
  }
};
