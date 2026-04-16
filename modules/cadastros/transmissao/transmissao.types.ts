
export interface ITransmissao {
  id: string;
  user_id?: string;
  nome: string; // Ex: Manual 5 Marchas, Automática 6 Marchas, CVT, Automatizada
  created_at: string;
  updated_at?: string;
  ativo?: boolean;
}
