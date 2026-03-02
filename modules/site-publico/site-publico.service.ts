import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import {
  IPublicPageData,
  IMontadoraPublic,
  IGetStockParams,
  IPaginatedStock,
  IVeiculoPublic,
  VeiculoPublicSchema,
  MontadoraPublicSchema,
  PublicPageDataSchema,
  PaginatedStockSchema,
  ISiteConteudo,
} from './site-publico.types';
import { SiteConteudoSchema } from '../editor-site/editor-site.types';
import { IEmpresa, EmpresaSchema } from '../ajustes/empresa/empresa.types';

// ─── Select padrão para veículos (evita duplicação) ───
const VEICULO_SELECT = `
  id, placa, chassi, renavam, km, ano_fabricacao, ano_modelo, portas, 
  combustivel, transmissao, motorizacao, valor_venda, valor_promocional, 
  status, fotos, caracteristicas_ids, opcionais_ids, observacoes, created_at,
  montadora_id, modelo_id, versao_id, tipo_veiculo_id, cor_id,
  montadora:cad_montadoras(id, nome, logo_url),
  modelo:cad_modelos(nome),
  versao:cad_versoes(nome),
  tipo_veiculo:cad_tipos_veiculos(nome)
`;

export const SitePublicoService = {

  /**
   * Busca dados da empresa. Cache será gerenciado pelo TanStack Query.
   */
  async getEmpresa(): Promise<IEmpresa> {
    const { data: empresa, error } = await supabase
      .from('config_empresa')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar dados da empresa:', error);
      throw error;
    }

    return EmpresaSchema.parse(empresa || {});
  },

  /**
   * Busca montadoras que possuem veículos disponíveis no site de forma otimizada.
   */
  async getMontadorasComEstoque(): Promise<IMontadoraPublic[]> {
    // Busca apenas as montadoras que realmente têm veículos publicados
    const { data: montadorasComEstoque, error } = await supabase
      .from('cad_montadoras')
      .select(`
        id, 
        nome, 
        logo_url,
        est_veiculos!inner(id)
      `)
      .eq('est_veiculos.publicado_site', true);

    if (error) {
      console.error('Erro ao buscar montadoras com estoque:', error);
      return [];
    }

    if (!montadorasComEstoque) return [];

    // Mapeia para o formato esperado pelo schema
    const rawResult = montadorasComEstoque.map(m => ({
      id: m.id,
      nome: m.nome,
      logo_url: m.logo_url || '',
      total_veiculos: (m.est_veiculos as any[]).length
    })).sort((a, b) => a.nome.localeCompare(b.nome));

    return z.array(MontadoraPublicSchema).parse(rawResult) as IMontadoraPublic[];
  },

  /**
   * Busca estoque paginado com filtros.
   */
  async getStockData(params: IGetStockParams): Promise<IPaginatedStock> {
    const { page, pageSize, brand, minPrice, maxPrice, search, sort, includeMontadoras = true } = params;

    let query = supabase
      .from('est_veiculos')
      .select(VEICULO_SELECT, { count: 'exact' })
      .eq('publicado_site', true);

    if (brand) query = query.eq('montadora_id', brand);
    if (minPrice) query = query.gte('valor_venda', minPrice);
    if (maxPrice) query = query.lte('valor_venda', maxPrice);

    if (search) {
      const sanitized = search.replace(/[%_\\]/g, '');
      if (sanitized.length > 0) {
        const [modelosResult, montadorasResult] = await Promise.all([
          supabase.from('cad_modelos').select('id').ilike('nome', `%${sanitized}%`),
          supabase.from('cad_montadoras').select('id').ilike('nome', `%${sanitized}%`)
        ]);

        const modeloIds = (modelosResult.data || []).map(m => m.id);
        const montadoraIds = (montadorasResult.data || []).map(m => m.id);

        const orFilters: string[] = [`placa.ilike.%${sanitized}%`];
        if (modeloIds.length > 0) {
          orFilters.push(`modelo_id.in.(${modeloIds.join(',')})`);
        }
        if (montadoraIds.length > 0) {
          orFilters.push(`montadora_id.in.(${montadoraIds.join(',')})`);
        }

        query = query.or(orFilters.join(','));
      }
    }

    if (sort === 'preco_asc') {
      query = query.order('valor_venda', { ascending: true });
    } else if (sort === 'preco_desc') {
      query = query.order('valor_venda', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [queryResult, montadoras] = await Promise.all([
      query.range(from, to),
      includeMontadoras ? this.getMontadorasComEstoque() : Promise.resolve(undefined)
    ]);

    if (queryResult.error) {
      console.error('Erro ao buscar estoque paginado:', queryResult.error);
      throw queryResult.error;
    }

    const rawResult = {
      veiculos: queryResult.data || [],
      total: queryResult.count || 0,
      page,
      pageSize,
      montadoras
    };

    return PaginatedStockSchema.parse(rawResult) as IPaginatedStock;
  },

  /**
   * Busca conteúdo editável do site (singleton).
   */
  async getSiteConteudo(): Promise<ISiteConteudo | null> {
    try {
      const { data, error } = await supabase
        .from('site_conteudo')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar conteúdo do site:', error);
        return null;
      }

      return data ? SiteConteudoSchema.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Dados da home page.
   */
  async getHomePageData(): Promise<IPublicPageData> {
    try {
      const [empresa, veiculosResult, montadoras, conteudo] = await Promise.all([
        this.getEmpresa().catch(() => ({} as IEmpresa)),
        supabase
          .from('est_veiculos')
          .select(VEICULO_SELECT)
          .eq('publicado_site', true)
          .order('created_at', { ascending: false })
          .limit(8),
        this.getMontadorasComEstoque(),
        this.getSiteConteudo()
      ]);

      const rawResult = {
        empresa,
        veiculos: veiculosResult.data || [],
        montadoras,
        conteudo
      };

      return PublicPageDataSchema.parse(rawResult) as IPublicPageData;
    } catch (error) {
      console.error('Erro ao carregar dados da home:', error);
      throw error;
    }
  },

  /**
   * Busca um veículo específico por ID.
   */
  async getVeiculoDetails(id: string): Promise<{
    veiculo: IVeiculoPublic | null;
    caracteristicas: { id: string; nome: string }[];
    opcionais: { id: string; nome: string }[];
    cores: { id: string; nome: string; rgb_hex: string }[];
    empresa: IEmpresa;
  }> {
    const [veiculoResult, caracResult, opResult, coresResult, empresa] = await Promise.all([
      supabase
        .from('est_veiculos')
        .select(VEICULO_SELECT)
        .eq('id', id)
        .maybeSingle(),
      supabase.from('cad_caracteristicas').select('id, nome'),
      supabase.from('cad_opcionais').select('id, nome'),
      supabase.from('cad_cores').select('id, nome, rgb_hex'),
      this.getEmpresa()
    ]);

    if (veiculoResult.error) {
      console.error('Erro ao buscar detalhes do veículo:', veiculoResult.error);
      throw veiculoResult.error;
    }

    return {
      veiculo: veiculoResult.data ? (VeiculoPublicSchema.parse(veiculoResult.data) as IVeiculoPublic) : null,
      caracteristicas: caracResult.data || [],
      opcionais: opResult.data || [],
      cores: coresResult.data || [],
      empresa
    };
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('site_publico_estoque_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'est_veiculos' }, () => onUpdate())
      .subscribe();
  }
};
