
export interface IMontadora {
  id: string;
  user_id?: string;
  nome: string;
  logo_url: string;
  created_at: string;
  updated_at?: string;
  ativo?: boolean;
}

export interface IMontadoraResponse {
  data: IMontadora[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export interface IMontadoraFiltros {
  limit?: number;
  ativo?: boolean;
}

export interface IMontadorasKpis {
  total: number;
  recentes: number;
}
