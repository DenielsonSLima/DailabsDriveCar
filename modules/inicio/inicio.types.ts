
export interface IDashboardStats {
  totalEstoque: number;
  valorGlobalEstoque: number;
  totalParceiros: number;
  vendasMesAtual: number;
  lucroProjetado: number;
  lucroRealizado: number;
}

export interface IRecentActivity {
  id: string;
  tipo: 'ESTOQUE' | 'PARCEIRO' | 'FINANCEIRO';
  descricao: string;
  data: string;
}

export interface IHistoryData {
  mes: string;
  vendas_valor: number;
  vendas_qtd: number;
  compras_valor: number;
  compras_qtd: number;
  despesas_valor: number;
  lucro_valor: number;
  estoque_valor: number;
}

export interface ISiteAnalyticsSummary {
  total_views: number;
  unique_visitors: number;
  views_today: number;
}

export interface ITopViewedVehicle {
  vehicle_id: string;
  view_count: number;
  placa: string;
  modelo_nome: string;
  montadora_nome: string;
  foto_url: string;
}

export interface IVisitorLocation {
  city: string;
  region: string;
  view_count: number;
}
