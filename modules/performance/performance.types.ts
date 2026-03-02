import { z } from 'zod';

export type PerformanceTab = 'MES_ATUAL' | 'OUTROS_MESES';

// ---- KPIs Resumo do Período Schema ----
const numericField = z.union([z.number(), z.null(), z.undefined()]).transform(val => val ?? 0);

export const PerformanceResumoSchema = z.object({
  total_vendas_valor: numericField,
  total_vendas_qtd: numericField,
  total_compras_valor: numericField,
  total_compras_qtd: numericField,
  lucro_bruto: numericField,
  margem_media: numericField,
  ticket_medio_venda: numericField,
  despesas_veiculos: numericField,
  retiradas_socios: numericField,
  contas_pagar_pendente: numericField,
  contas_receber_pendente: numericField,
  contas_pagar_pago: numericField,
  contas_receber_pago: numericField,
  saldo_contas_bancarias: numericField,
  total_entradas: numericField,
  total_saidas: numericField,
});

// ---- KPIs Resumo do Período ----
export interface IPerformanceResumo {
  total_vendas_valor: number;
  total_vendas_qtd: number;
  total_compras_valor: number;
  total_compras_qtd: number;
  lucro_bruto: number;
  margem_media: number;
  ticket_medio_venda: number;
  despesas_veiculos: number;
  retiradas_socios: number;
  contas_pagar_pendente: number;
  contas_receber_pendente: number;
  contas_pagar_pago: number;
  contas_receber_pago: number;
  saldo_contas_bancarias: number;
  total_entradas: number;
  total_saidas: number;
}

// ---- Venda do Período ----
export interface IPerformanceVenda {
  id: string;
  numero_venda: string;
  data_venda: string;
  cliente_nome: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  valor_venda: number;
  custo_veiculo: number;
  custo_servicos: number;
  lucro_bruto: number;
  margem_percent: number;
}

// ---- Compra do Período ----
export interface IPerformanceCompra {
  id: string;
  numero_pedido: string;
  data_compra: string;
  fornecedor_nome: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  valor_negociado: number;
}

// ---- Título Financeiro ----
export interface IPerformanceTitulo {
  id: string;
  tipo: 'PAGAR' | 'RECEBER';
  descricao: string;
  valor_total: number;
  valor_pago: number;
  data_vencimento: string;
  status: string;
  parceiro_nome: string;
  categoria_nome: string;
}

// ---- Despesa de Veículo ----
export interface IPerformanceDespesaVeiculo {
  id: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  descricao: string;
  valor_total: number;
  data: string;
  status_pagamento: string;
}

// ---- Retirada de Sócio ----
export interface IPerformanceRetirada {
  id: string;
  socio_nome: string;
  valor: number;
  data: string;
  tipo: string;
  descricao: string;
}

// ---- Veículo em Estoque (snapshot) ----
export interface IPerformanceEstoque {
  id: string;
  modelo: string;
  placa: string;
  valor_custo: number;
  valor_custo_servicos: number;
  valor_venda: number;
  margem_percent: number;
  dias_estoque: number;
  status: string;
}

// ---- Conta Bancária (saldo) ----
export interface IPerformanceConta {
  id: string;
  banco_nome: string;
  tipo: string;
  saldo_atual: number;
}

// ---- Dados completos do período ----
export interface IPerformanceData {
  resumo: IPerformanceResumo;
  vendas: IPerformanceVenda[];
  compras: IPerformanceCompra[];
  titulos_pagar: IPerformanceTitulo[];
  titulos_receber: IPerformanceTitulo[];
  despesas_veiculos: IPerformanceDespesaVeiculo[];
  retiradas: IPerformanceRetirada[];
  estoque: IPerformanceEstoque[];
  contas_bancarias: IPerformanceConta[];
}