import { z } from 'zod';
import { IParceiro } from '../parceiros/parceiros.types';
import { IFormaPagamento } from '../cadastros/formas-pagamento/formas-pagamento.types';
import { ICondicaoPagamento } from '../cadastros/condicoes-pagamento/condicoes-pagamento.types';
import { ICorretor } from '../cadastros/corretores/corretores.types';
import { IVeiculo } from '../estoque/estoque.types';
import { IContaBancaria } from '../ajustes/contas-bancarias/contas.types';
import { ITitulo } from '../financeiro/financeiro.types';

export type StatusPedidoCompra = 'RASCUNHO' | 'CONCLUIDO' | 'CANCELADO';

export interface IPedidoPagamento {
  id: string;
  pedido_id: string;
  data_pagamento: string;
  forma_pagamento_id: string;
  condicao_id?: string;
  conta_bancaria_id?: string;
  valor: number;
  observacao?: string;
  created_at?: string;

  // Joins
  forma_pagamento?: IFormaPagamento;
  condicao?: ICondicaoPagamento;
  conta_bancaria?: IContaBancaria;
}

export interface IPedidoCompra {
  id: string;
  user_id?: string;
  data_compra: string;
  corretor_id?: string;
  fornecedor_id?: string;
  forma_pagamento_id?: string;

  endereco_igual_cadastro: boolean;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  complemento?: string;

  observacoes?: string;
  status: StatusPedidoCompra;
  created_at: string;
  updated_at?: string;

  numero_pedido?: string;
  descricao_veiculo?: string;
  valor_negociado: number;
  veiculo_id?: string;
  previsao_pagamento?: string;

  // Joins
  fornecedor?: IParceiro;
  corretor?: ICorretor;
  forma_pagamento?: IFormaPagamento;
  veiculos?: IVeiculo[];
  pagamentos?: IPedidoPagamento[];
  titulos?: ITitulo[];
}

export interface IPedidoFiltros {
  busca: string;
  dataInicio: string;
  dataFim: string;
  corretorId: string;
  socioId: string;
  page?: number;
  limit?: number;
}

export interface IPedidoCompraResponse {
  data: IPedidoCompra[];
  count: number;
  currentPage: number;
  totalPages: number;
}

// Zod Schemas for Validation
export const PedidoPagamentoSchema = z.object({
  id: z.string().uuid().optional(),
  pedido_id: z.string().uuid(),
  data_pagamento: z.string(),
  forma_pagamento_id: z.string().uuid(),
  condicao_id: z.string().uuid().optional().nullable(),
  conta_bancaria_id: z.string().uuid().optional().nullable(),
  valor: z.number().positive(),
  observacao: z.string().optional().nullable(),
});

export const PedidoCompraSchema = z.object({
  id: z.string().uuid().optional(),
  data_compra: z.string(),
  corretor_id: z.string().uuid().optional().nullable(),
  fornecedor_id: z.string().uuid().optional().nullable(),
  forma_pagamento_id: z.string().uuid().optional().nullable(),
  endereco_igual_cadastro: z.boolean().default(true),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().length(2).optional().nullable(),
  complemento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  status: z.enum(['RASCUNHO', 'CONCLUIDO', 'CANCELADO']),
  numero_pedido: z.coerce.string().optional().nullable(),
  descricao_veiculo: z.string().optional().nullable(),
  valor_negociado: z.number().nonnegative().optional().nullable(),
  veiculo_id: z.string().uuid().optional().nullable(),
  previsao_pagamento: z.string().optional().nullable(),
});

export type IPedidoPagamentoInput = z.infer<typeof PedidoPagamentoSchema>;
export type IPedidoCompraInput = z.infer<typeof PedidoCompraSchema>;
