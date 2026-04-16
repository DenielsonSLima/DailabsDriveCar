
import { IModelo } from '../modelos/modelos.types';

export interface IVersao {
  id: string;
  user_id?: string;
  modelo_id: string;
  nome: string; 
  motorizacao: string;
  transmissao: string;
  combustivel: string; // Novo campo
  ano_modelo: number;
  ano_fabricacao: number;
  created_at: string;
  updated_at?: string;
  ativo?: boolean;
  // Join
  modelo?: IModelo;
}
