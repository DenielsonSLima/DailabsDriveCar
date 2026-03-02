import { z } from 'zod';

export enum TipoParceiro {
  CLIENTE = 'CLIENTE',
  FORNECEDOR = 'FORNECEDOR',
  AMBOS = 'AMBOS'
}

export enum PessoaTipo {
  FISICA = 'FISICA',
  JURIDICA = 'JURIDICA'
}

export const ParceiroSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  pessoa_tipo: z.nativeEnum(PessoaTipo),
  nome: z.string().min(1, "O nome é obrigatório"),
  razao_social: z.string().nullable().optional(),
  documento: z.string().min(11, "Documento inválido"),
  inscricao_estadual: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal('')),
  telefone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  tipo: z.nativeEnum(TipoParceiro),
  ativo: z.boolean().default(true),
  cep: z.string().min(8, "CEP inválido"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  complemento: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export interface IParceiro extends z.infer<typeof ParceiroSchema> { }

export type ParceiroTab = 'ativos' | 'clientes' | 'fornecedores' | 'inativos';

export const ParceirosParamsSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(9),
  search: z.string().optional(),
  tab: z.enum(['ativos', 'clientes', 'fornecedores', 'inativos']).optional()
});

export interface IParceirosFilters extends z.infer<typeof ParceirosParamsSchema> { }

export interface IParceirosResponse {
  data: IParceiro[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export interface IParceirosStats {
  total: number;
  ativos: number;
  clientes: number;
  fornecedores: number;
  inativos: number;
}
