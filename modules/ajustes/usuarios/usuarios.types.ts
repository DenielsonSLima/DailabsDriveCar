
export type UserRole = 'ADMIN' | 'OPERADOR' | 'VENDEDOR' | 'GESTOR';

export interface IUsuario {
  id: string;
  nome: string;
  email?: string;
  role: UserRole;
  avatar_url?: string;
  ativo?: boolean;
  force_password_change?: boolean;
  created_at?: string; // Tornado opcional
  updated_at?: string; // Tornado opcional
  // Campos extras para formulário
  sobrenome?: string;
  cpf?: string;
  senha?: string;
  telefone?: string;
}
