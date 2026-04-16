
export interface ICor {
  id: string;
  user_id?: string;
  nome: string;
  rgb_hex: string; // Ex: #FFFFFF, #000000, #FF0000
  created_at: string;
  updated_at?: string;
  ativo?: boolean;
}
