
import { supabase } from '../../../lib/supabase';
import { IMontadora, IMontadoraFiltros, IMontadoraResponse, IMontadorasKpis } from './montadoras.types';

const TABLE = 'cad_montadoras';


export const MontadorasService = {
  /**
   * Busca todas as montadoras ordenadas alfabeticamente.
   * Por padrão busca apenas as ativas.
   */
  async getAll(onlyActive = true): Promise<IMontadora[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('nome', { ascending: true });

    if (onlyActive) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Erro ao buscar dados de ${TABLE}:`, error);
      return [];
    }
    return (data || []) as IMontadora[];
  },

  async getPaginated(filters: IMontadoraFiltros): Promise<IMontadoraResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from(TABLE)
      .select('*', { count: 'exact' });

    if (filters.search) {
      query = query.ilike('nome', `%${filters.search}%`);
    }

    // Filtro de status (se não passar nada, assume ativos)
    const statusFilter = filters.ativo !== undefined ? filters.ativo : true;
    query = query.eq('ativo', statusFilter);

    const { data, error, count } = await query
      .order('nome', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data || []) as IMontadora[],
      count: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  },

  async getKpis(): Promise<IMontadorasKpis> {
    const { count: total } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recent } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      total: total || 0,
      recentes: recent || 0
    };
  },

  /**
   * Salva ou atualiza uma montadora.
   */
  async save(payload: Partial<IMontadora>): Promise<IMontadora> {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error(`Erro ao salvar em ${TABLE}:`, error);
      throw error;
    }
    return data as IMontadora;
  },

  /**
   * Inativa uma montadora pelo ID (Soft Delete).
   */
  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error(`Erro ao inativar de ${TABLE}:`, error);
      throw error;
    }
    return true;
  },

  /**
   * Reativa uma montadora pelo ID.
   */
  async reactivate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .update({ ativo: true })
      .eq('id', id);

    if (error) {
      console.error(`Erro ao reativar em ${TABLE}:`, error);
      throw error;
    }
    return true;
  },

  /**
   * Ativa a escuta em tempo real.
   * @param onUpdate Callback disparado em qualquer mudança (INSERT, UPDATE, DELETE)
   */
  subscribe(onUpdate: () => void) {
    return supabase
      .channel('public:cad_montadoras')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        () => {
          onUpdate(); // Notifica o componente para recarregar os dados
        }
      )
      .subscribe();
  }
};
