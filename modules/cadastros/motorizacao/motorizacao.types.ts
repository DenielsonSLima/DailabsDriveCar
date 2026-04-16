
export interface IMotorizacao {
  id: string;
  user_id?: string;
  nome: string; // Ex: 1.0, 1.6 16V, 2.0 Turbo
  created_at: string;
  updated_at?: string;
  ativo?: boolean;
}
