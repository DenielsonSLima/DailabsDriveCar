import { z } from 'zod';
import { IParceiro } from '../parceiros/parceiros.types';
import { IVeiculo } from '../estoque/estoque.types';
import { IFormaPagamento } from '../cadastros/formas-pagamento/formas-pagamento.types';
import { ICondicaoRecebimento } from '../cadastros/condicoes-recebimento/condicoes-recebimento.types';
import { IContaBancaria } from '../ajustes/contas-bancarias/contas.types';

import { ICorretor } from '../cadastros/corretores/corretores.types';

export type StatusPedidoVenda = 'RASCUNHO' | 'CONCLUIDO' | 'CANCELADO';
export type VendaTab = 'MES_ATUAL' | 'RASCUNHO' | 'TODOS';

export interface IVendaPagamento {
  id: string;
  pedido_id: string;
  data_recebimento: string;
  forma_pagamento_id: string;
  condicao_id?: string;
  conta_bancaria_id?: string;
  valor: number;
  observacao?: string;
  created_at?: string;

  // Joins
  forma_pagamento?: IFormaPagamento;
  condicao?: ICondicaoRecebimento;
  conta_bancaria?: IContaBancaria;
}

export interface IPedidoVenda {
  id: string;
  user_id?: string;
  numero_venda: string;
  data_venda: string;
  cliente_id: string;
  veiculo_id: string;
  corretor_id?: string;
  valor_venda: number;
  status: StatusPedidoVenda;
  forma_pagamento_id?: string;
  is_consignado: boolean;

  // Fix: Adicionando campos de endereço e controle de sincronização com cadastro para evitar erros de tipo no formulário de venda
  endereco_igual_cadastro: boolean;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  complemento?: string;

  observacoes?: string;
  created_at: string;
  updated_at?: string;

  // Joins
  cliente?: IParceiro;
  veiculo?: IVeiculo & { pedido_compra?: { id: string, forma_pagamento?: IFormaPagamento } };
  pagamentos?: IVendaPagamento[];
  forma_pagamento?: IFormaPagamento;
  corretor?: ICorretor;
}

export interface IVendaFiltros {
  busca: string;
  dataInicio: string;
  dataFim: string;
  status?: StatusPedidoVenda;
  corretorId: string;
  socioId: string;
  page?: number;
  limit?: number;
}

export interface IPedidoVendaResponse {
  data: IPedidoVenda[];
  count: number;
  currentPage: number;
  totalPages: number;
}

// Zod Schemas for Validation
export const VendaPagamentoSchema = z.object({
  id: z.string().uuid().optional(),
  pedido_id: z.string().uuid(),
  data_recebimento: z.string(),
  forma_pagamento_id: z.string().uuid(),
  condicao_id: z.string().uuid().optional().nullable(),
  conta_bancaria_id: z.string().uuid().optional().nullable(),
  valor: z.number().positive(),
  observacao: z.string().optional().nullable(),
});

export const PedidoVendaSchema = z.object({
  id: z.string().uuid().optional(),
  numero_venda: z.coerce.string().optional().nullable(),
  data_venda: z.string(),
  cliente_id: z.string().uuid(),
  veiculo_id: z.string().uuid().optional().nullable(),
  corretor_id: z.string().uuid().optional().nullable(),
  valor_venda: z.number().nonnegative(),
  status: z.enum(['RASCUNHO', 'CONCLUIDO', 'CANCELADO']),
  forma_pagamento_id: z.string().uuid().optional().nullable(),
  is_consignado: z.boolean().default(false),
  endereco_igual_cadastro: z.boolean().default(true),
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().length(2).optional().nullable(),
  complemento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export type IVendaPagamentoInput = z.infer<typeof VendaPagamentoSchema>;
export type IPedidoVendaInput = z.infer<typeof PedidoVendaSchema>;
