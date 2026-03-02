import { ITitulo } from '../../financeiro.types';

export type FixasTab = 'MES_ATUAL' | 'ATRASADOS' | 'OUTROS' | 'FUTUROS';
export type GroupByFixa = 'nenhum' | 'mes' | 'categoria';

export interface IFixasFiltros {
  busca: string;
  dataInicio: string;
  dataFim: string;
  categoriaId: string;
  status: string;
}

export interface ITituloFixa extends Omit<ITitulo, 'parceiro' | 'categoria'> {
  parceiro?: {
    nome: string;
  };
  categoria?: {
    id: string;
    nome: string;
  };
}
