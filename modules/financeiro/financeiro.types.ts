import { z } from 'zod';
import { IContaBancaria } from '../ajustes/contas-bancarias/contas.types';
import { IParceiro } from '../parceiros/parceiros.types';
import { IFormaPagamento } from '../cadastros/formas-pagamento/formas-pagamento.types';

export type TipoTitulo = 'PAGAR' | 'RECEBER';
export type StatusTitulo = 'PENDENTE' | 'PARCIAL' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
export type TipoCategoria = 'FIXA' | 'VARIAVEL' | 'OUTROS';

export const TituloSchema = z.object({
  id: z.string(),
  parceiro_id: z.string().optional().nullable(),
  categoria_id: z.string().optional().nullable(),
  pedido_id: z.string().optional().nullable(),
  descricao: z.string(),
  tipo: z.enum(['PAGAR', 'RECEBER']),
  status: z.enum(['PENDENTE', 'PARCIAL', 'PAGO', 'ATRASADO', 'CANCELADO']),
  valor_total: z.number(),
  valor_pago: z.number().default(0),
  valor_desconto: z.number().optional().nullable().default(0),
  valor_acrescimo: z.number().optional().nullable().default(0),
  data_emissao: z.string(),
  data_vencimento: z.string(),
  parcela_numero: z.number().default(1),
  parcela_total: z.number().default(1),
  grupo_id: z.string().optional().nullable(),
  documento_ref: z.string().optional().nullable(),
  forma_pagamento_id: z.string().optional().nullable(),
  veiculo_id: z.string().optional().nullable(),
  despesa_veiculo_id: z.string().optional().nullable(),
  origem_tipo: z.enum(['PEDIDO_COMPRA', 'PEDIDO_VENDA', 'DESPESA_VEICULO', 'DESPESA_FIXA', 'DESPESA_VARIAVEL', 'OUTRO_CREDITO', 'MANUAL']).optional().nullable(),
  origem_id: z.string().optional().nullable(),
  created_at: z.string(),
});

export const TransacaoSchema = z.object({
  id: z.string(),
  titulo_id: z.string().optional().nullable(),
  conta_origem_id: z.string().optional().nullable(),
  conta_destino_id: z.string().optional().nullable(),
  valor: z.number(),
  data_pagamento: z.string(),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA']),
  tipo_transacao: z.string().optional().nullable(),
  forma_pagamento_id: z.string().optional().nullable(),
  comprovante_url: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
});

export interface ICategoriaFinanceira {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  natureza: 'ENTRADA' | 'SAIDA';
}

export const CategoriaFinanceiraSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.enum(['FIXA', 'VARIAVEL', 'OUTROS']),
  natureza: z.enum(['ENTRADA', 'SAIDA']),
});

// Fix: Adding IFinanceiroKpis interface to satisfy imports in Financeiro.page.tsx
export interface IFinanceiroKpis {
  saldo_disponivel: number;
  compra_veiculos: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  outras_receitas: number;
  retiradas: number;
}

export interface IPendencias {
  atrasado: { total: number; count: number };
  hoje: { total: number; count: number };
}

export interface ITitulo {
  id: string;
  parceiro_id?: string;
  categoria_id?: string;
  pedido_id?: string;
  descricao: string;
  tipo: TipoTitulo;
  status: StatusTitulo;
  valor_total: number;
  valor_pago: number;
  valor_desconto?: number;
  valor_acrescimo?: number;
  data_emissao: string;
  data_vencimento: string;
  parcela_numero: number;
  parcela_total: number;
  grupo_id?: string;
  documento_ref?: string;
  forma_pagamento_id?: string;
  veiculo_id?: string;
  despesa_veiculo_id?: string;
  // Rastreabilidade
  origem_tipo?: 'PEDIDO_COMPRA' | 'PEDIDO_VENDA' | 'DESPESA_VEICULO' | 'DESPESA_FIXA' | 'DESPESA_VARIAVEL' | 'OUTRO_CREDITO' | 'MANUAL';
  origem_id?: string;
  created_at: string;

  // Joins
  parceiro?: IParceiro;
  categoria?: ICategoriaFinanceira;
}

export interface ILancarDespesaPayload {
  descricao: string;
  valor_total: number;
  categoria_id: string;
  qtd_parcelas: number;
  data_vencimento: string;     // ISO String da primeira parcela (ou única)
  dias_intervalo: number;      // 30 para mensal
  pago_avista: boolean;
  conta_id?: string;           // Obrigatório se pago_avista
  forma_pagamento_id?: string; // Obrigatório se pago_avista
  natureza: 'FIXA' | 'VARIAVEL';
  documento_ref?: string;
}

export interface ITransacao {
  id: string;
  titulo_id?: string;
  conta_origem_id?: string;
  conta_destino_id?: string;
  valor: number;
  data_pagamento: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
  tipo_transacao?: string; // Added to match service usage
  forma_pagamento_id?: string;
  comprovante_url?: string;
  descricao?: string; // Added to match service usage

  // Joins
  titulo?: ITitulo;
  conta_origem?: IContaBancaria;
  forma_pagamento?: IFormaPagamento;
}

export interface IExtratoFiltros {
  dataInicio?: string;
  dataFim?: string;
  tipo?: string;
  page?: number;
  limit?: number;
}

export interface IExtratoResponse {
  data: ITransacao[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export interface IExtratoTotals {
  entradas: number;
  saidas: number;
  balanco: number;
}

// ─── HISTÓRICO GERAL UNIFICADO ─────────────────────────
export type OrigemHistorico = 'COMPRA' | 'VENDA' | 'DESPESA_VEICULO' | 'TRANSFERENCIA' | 'RETIRADA' | 'CREDITO' | 'SALDO_INICIAL' | 'MANUAL';
export type StatusHistorico = 'REALIZADO' | 'PENDENTE' | 'PARCIAL' | 'ATRASADO' | 'CANCELADO';

export interface IHistoricoUnificado {
  id: string;
  data: string;                  // data_pagamento (transação) ou data_vencimento (título)
  data_emissao?: string;         // data de criação/emissão
  tipo_movimento: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'A_PAGAR' | 'A_RECEBER';
  descricao: string;
  valor: number;
  valor_pago?: number;
  valor_restante?: number;
  status: StatusHistorico;
  origem: OrigemHistorico;
  parceiro_nome?: string;
  conta_nome?: string;
  forma_pagamento?: string;
  parcela_info?: string;         // "2/5"
  pedido_ref?: string;           // "PC-001" ou "VD-001"
  pedido_id?: string;
  titulo_id?: string;
  source: 'TRANSACAO' | 'TITULO';
}

export interface IHistoricoFiltros {
  dataInicio?: string;
  dataFim?: string;
  tipo?: string;                 // ENTRADA | SAIDA | A_PAGAR | A_RECEBER | TRANSFERENCIA
  status?: string;               // REALIZADO | PENDENTE | PARCIAL | ATRASADO
  origem?: string;               // COMPRA | VENDA | DESPESA_VEICULO | TRANSFERENCIA | etc
  busca?: string;                // texto livre
  page?: number;
  limit?: number;
}

export interface IHistoricoResponse {
  data: IHistoricoUnificado[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export interface IHistoricoTotals {
  entradas_realizadas: number;
  saidas_realizadas: number;
  a_pagar_pendente: number;
  a_receber_pendente: number;
  saldo_periodo: number;
}