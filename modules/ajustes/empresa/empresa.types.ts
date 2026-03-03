import { z } from 'zod';

export interface IEmpresa {
  id?: string;
  user_id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  website?: string;

  // Endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;

  logo_url?: string;
  stories_frame_url?: string;
  feed_frame_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const EmpresaSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  cnpj: z.string(),
  razao_social: z.string(),
  nome_fantasia: z.string(),
  inscricao_estadual: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  cep: z.string(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().optional().nullable(),
  bairro: z.string(),
  cidade: z.string(),
  uf: z.string(),
  logo_url: z.string().optional().nullable(),
  stories_frame_url: z.string().optional().nullable(),
  feed_frame_url: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export interface IBrasilAPICNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  ddd_telefone_1: string;
  email: string;
}
