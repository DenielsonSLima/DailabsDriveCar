import { z } from 'zod';
import { IVeiculo, VeiculoSchema } from '../estoque/estoque.types';
import { IEmpresa, EmpresaSchema } from '../ajustes/empresa/empresa.types';
import { ISiteConteudo, SiteConteudoSchema } from '../editor-site/editor-site.types';

// Re-export para conveniência
export type { ISiteConteudo };

// ─── Tipo de veículo com relações de join (montadora, modelo, etc.) ───
export interface IVeiculoRelations {
  montadora?: { id: string; nome: string; logo_url?: string };
  modelo?: { nome: string };
  versao?: { nome: string };
  tipo_veiculo?: { nome: string };
}

export type IVeiculoPublic = IVeiculo & IVeiculoRelations;

export const VeiculoPublicSchema = VeiculoSchema.extend({
  montadora: z.object({
    id: z.string(),
    nome: z.string(),
    logo_url: z.string().optional().nullable()
  }).optional().nullable(),
  modelo: z.object({ nome: z.string() }).optional().nullable(),
  versao: z.object({ nome: z.string() }).optional().nullable(),
  tipo_veiculo: z.object({ nome: z.string() }).optional().nullable(),
});

export interface IMontadoraPublic {
  id: string;
  nome: string;
  logo_url: string;
  total_veiculos: number;
}

export const MontadoraPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  logo_url: z.string().nullable(),
  total_veiculos: z.number().default(0)
});

export interface IPublicPageData {
  empresa: IEmpresa;
  veiculos: IVeiculoPublic[];
  montadoras: IMontadoraPublic[];
  conteudo: ISiteConteudo | null;
}

export const PublicPageDataSchema = z.object({
  empresa: EmpresaSchema,
  veiculos: z.array(VeiculoPublicSchema).default([]),
  montadoras: z.array(MontadoraPublicSchema).default([]),
  conteudo: SiteConteudoSchema.nullable().default(null),
});

export interface IGetStockParams {
  page: number;
  pageSize: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'created_desc' | 'preco_asc' | 'preco_desc';
  includeMontadoras?: boolean;
}

export interface IPaginatedStock {
  veiculos: IVeiculoPublic[];
  total: number;
  page: number;
  pageSize: number;
  montadoras?: IMontadoraPublic[];
}

export const PaginatedStockSchema = z.object({
  veiculos: z.array(VeiculoPublicSchema).default([]),
  total: z.number().default(0),
  page: z.number(),
  pageSize: z.number(),
  montadoras: z.array(MontadoraPublicSchema).optional()
});