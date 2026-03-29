import { z } from 'zod';

export const VeiculoFotoSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().url("URL de foto inválida"),
  ordem: z.number().int().min(0).default(0),
  is_capa: z.boolean().default(false)
});

export interface IVeiculoFoto extends z.infer<typeof VeiculoFotoSchema> { }

export const VeiculoSocioSchema = z.object({
  socio_id: z.string().uuid(),
  nome: z.string(),
  valor: z.number().min(0).default(0),
  porcentagem: z.number().min(0).max(100).default(0)
});

export interface IVeiculoSocio extends z.infer<typeof VeiculoSocioSchema> { }

export const VeiculoDespesaSchema = z.object({
  id: z.string().uuid().optional(),
  veiculo_id: z.string().uuid(),
  data: z.string().date(),
  data_vencimento: z.string().date().optional(),
  status_pagamento: z.enum(['PAGO', 'PENDENTE']).default('PENDENTE'),
  tipo: z.literal('VARIAVEL').default('VARIAVEL'),
  categoria_id: z.string().uuid(),
  categoria_nome: z.string().optional(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  quantidade: z.number().min(0.01).default(1),
  valor_unitario: z.number().min(0).default(0),
  valor_total: z.number().min(0).default(0),
  forma_pagamento_id: z.string().uuid(),
  conta_bancaria_id: z.string().uuid().optional(),
  created_at: z.string().optional()
});

export interface IVeiculoDespesa extends z.infer<typeof VeiculoDespesaSchema> {
  categoria?: { nome: string };
  forma_pagamento?: { nome: string };
  conta_bancaria?: { banco_nome: string };
  pagamentos?: any[];
}

export const VeiculoSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  montadora_id: z.string().uuid(),
  tipo_veiculo_id: z.string().uuid(),
  modelo_id: z.string().uuid(),
  versao_id: z.string().uuid(),
  cor_id: z.string().uuid().optional().nullable(),
  placa: z.string().optional().nullable(),
  chassi: z.string().optional().nullable(),
  renavam: z.string().optional().nullable(),
  km: z.number().min(0).default(0),
  ano_fabricacao: z.number().int().min(1900),
  ano_modelo: z.number().int().min(1900),
  combustivel: z.string().optional().nullable(),
  transmissao: z.string().optional().nullable(),
  motorizacao: z.string().optional().nullable(),
  portas: z.number().int().min(1).default(4),
  valor_custo: z.number().min(0).default(0),
  valor_custo_servicos: z.number().min(0).default(0),
  valor_venda: z.number().min(0).default(0),
  valor_promocional: z.number().min(0).optional().nullable(),
  valor_total_investido: z.number().min(0).optional(),
  valor_lucro_estimado: z.number().min(0).optional(),
  valor_margem_estimada: z.number().min(0).optional(),
  status: z.enum(['DISPONIVEL', 'RESERVADO', 'VENDIDO', 'PREPARACAO']).default('PREPARACAO'),
  pedido_id: z.string().uuid().optional().nullable(),
  is_consignado: z.boolean().default(false),
  publicado_site: z.boolean().default(false),
  fotos: z.array(VeiculoFotoSchema).default([]),
  socios: z.array(VeiculoSocioSchema).default([]),
  despesas: z.array(VeiculoDespesaSchema).optional(),
  caracteristicas_ids: z.array(z.string().uuid()).default([]),
  opcionais_ids: z.array(z.string().uuid()).default([]),
  observacoes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export interface IVeiculo extends z.infer<typeof VeiculoSchema> {
  montadora?: { nome: string; logo_url: string };
  modelo?: { nome: string };
  versao?: { nome: string };
  tipo_veiculo?: { nome: string };
}

export interface IEstoqueResponse {
  data: IVeiculo[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export const EstoqueFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).default(12),
  search: z.string().optional(),
  montadoraId: z.string().uuid().optional(),
  tipoId: z.string().uuid().optional(),
  statusTab: z.enum(['DISPONIVEL', 'RASCUNHO', 'TODOS']).default('DISPONIVEL')
});

export interface IEstoqueFilters extends z.infer<typeof EstoqueFiltersSchema> { }