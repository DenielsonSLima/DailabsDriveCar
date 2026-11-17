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
  nome: z.string().trim().min(1, "O nome é obrigatório"),
  razao_social: z.string().nullable().optional(),
  documento: z.string().nullable().optional().or(z.literal('')),
  inscricao_estadual: z.string().nullable().optional(),
  email: z.string().email("Email inválido").nullable().optional().or(z.literal('')),
  telefone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  tipo: z.nativeEnum(TipoParceiro),
  ativo: z.boolean().default(true),
  cep: z.string().refine(value => !value || /^\d{5}-?\d{3}$/.test(value), "Informe um CEP válido ou deixe em branco").nullable().optional(),
  logradouro: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  cidade: z.string().nullable().optional(),
  uf: z.string().refine(value => !value || /^[A-Za-z]{2}$/.test(value), "UF deve ter 2 letras ou ficar em branco").nullable().optional(),
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
