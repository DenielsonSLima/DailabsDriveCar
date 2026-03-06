import { ITitulo } from '../../financeiro.types';

export type VariaveisTab = 'EM_ABERTO' | 'PAGOS' | 'TODOS';
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
