import { ITitulo } from '../../financeiro.types';

export type CreditosTab = 'ABERTO' | 'PAGO' | 'TODOS';
export type GroupByCredito = 'nenhum' | 'mes' | 'conta';

export interface ICreditoFiltros {
  busca: string;
  dataInicio: string;
  dataFim: string;
  page?: number;
  pageSize?: number;
}

export interface ITituloCredito extends Omit<ITitulo, 'parceiro' | 'categoria'> {
  parceiro?: {
    nome: string;
  };
  categoria?: {
    nome: string;
  };
  conta_bancaria?: {
    banco_nome: string;
    conta: string;
  };
  transacoes?: {
    id: string;
    valor: number;
    data_pagamento: string;
    conta_origem: {
      banco_nome: string;
      conta: string;
    } | null;
    forma_pagamento?: {
      nome: string;
    };
  }[];
}
