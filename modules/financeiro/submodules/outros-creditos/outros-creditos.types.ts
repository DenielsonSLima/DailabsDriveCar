import { ITitulo } from '../../financeiro.types';

export type CreditosTab = 'MES_ATUAL' | 'OUTROS';
export type GroupByCredito = 'nenhum' | 'mes' | 'conta';

export interface ICreditoFiltros {
  busca: string;
  dataInicio: string;
  dataFim: string;
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
    conta_origem: {
      banco_nome: string;
      conta: string;
    } | null;
  }[];
}
