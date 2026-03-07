import { z } from 'zod';
import { ITitulo, TituloSchema } from '../../financeiro.types';

export type PagarTab = 'EM_ABERTO' | 'PAGOS' | 'TODOS';

export interface IPagarFiltros {
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const TituloPagarSchema = TituloSchema.extend({
  parceiro: z.object({
    nome: z.string().optional().nullable(),
    documento: z.string().optional().nullable(),
  }).optional().nullable(),
  categoria: z.object({
    nome: z.string().optional().nullable(),
  }).optional().nullable(),
  veiculo: z.object({
    placa: z.string().optional().nullable(),
    modelo: z.object({
      nome: z.string().optional().nullable(),
    }).optional().nullable(),
    montadora: z.object({
      nome: z.string().optional().nullable(),
    }).optional().nullable(),
  }).optional().nullable(),
});

export interface ITituloPagar extends Omit<ITitulo, 'parceiro' | 'categoria'> {
  parceiro?: {
    nome: string;
    documento: string;
  };
  categoria?: {
    nome: string;
  };
  veiculo?: {
    placa: string | null;
    modelo: { nome: string } | null;
    montadora: { nome: string } | null;
  } | null;
}

export interface IPagarResponse {
  data: ITituloPagar[];
  count: number;
  currentPage: number;
  totalPages: number;
}

export const PagarResponseSchema = z.object({
  data: z.array(TituloPagarSchema),
  count: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});
