import { ITitulo } from '../../financeiro.types';

export type VariaveisTab = 'MES_ATUAL' | 'ATRASADOS' | 'OUTROS' | 'FUTUROS';
export type GroupByVariavel = 'nenhum' | 'mes' | 'categoria';

export interface IVariaveisFiltros {
  busca: string;
  dataInicio: string;
  dataFim: string;
  categoriaId: string;
  status: string;
}

export interface ITituloVariavel extends Omit<ITitulo, 'parceiro' | 'categoria'> {
  parceiro?: {
    nome: string;
  };
  categoria?: {
    id: string;
    nome: string;
  };
}
