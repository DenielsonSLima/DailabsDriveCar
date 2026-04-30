import { ITitulo } from '../../financeiro.types';

export type DebitosTab = 'ABERTO' | 'PAGO' | 'TODOS';
export type SortFieldDebito = 'alfabeto' | 'data' | 'valor';
export type SortOrder = 'asc' | 'desc';

export interface IDebitoFiltros {
  busca: string;
  dataInicio: string;
  dataFim: string;
  page?: number;
  pageSize?: number;
}

export interface ITituloDebito extends Omit<ITitulo, 'parceiro' | 'categoria'> {
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
  socios?: {
    socio_id: string;
    valor: number;
    porcentagem: number;
    socio?: {
      nome: string;
    };
  }[];
}
