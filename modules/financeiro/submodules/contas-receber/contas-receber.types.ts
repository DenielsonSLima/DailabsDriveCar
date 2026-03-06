import { z } from 'zod';
import { ITitulo, TituloSchema } from '../../financeiro.types';

export type ReceberTab = 'MES_ATUAL' | 'ATRASADOS' | 'OUTROS' | 'FUTUROS';

export interface IReceberFiltros {
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const TituloReceberSchema = TituloSchema.extend({
  parceiro: z.object({
    nome: z.string().optional().nullable(),
    documento: z.string().optional().nullable(),
  }).optional().nullable(),
  categoria: z.object({
    nome: z.string().optional().nullable(),
  }).optional().nullable(),
  transacoes: z.array(z.any()).optional().nullable(),
});

export interface ITituloReceber extends Omit<ITitulo, 'parceiro' | 'categoria'> {
  parceiro?: {
    nome: string;
    documento: string;
  };
  categoria?: {
    nome: string;
  };
  transacoes?: any[];
}

export interface IReceberResponse {
  data: ITituloReceber[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export const ReceberResponseSchema = z.object({
  data: z.array(TituloReceberSchema),
  count: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});
