
export interface ICidade {
  id: string;
  user_id?: string;
  nome: string;
  uf: string;
  created_at: string;
  updated_at?: string;
  ativo?: boolean;
}

export interface ICidadesAgrupadas {
  [uf: string]: ICidade[];
}
