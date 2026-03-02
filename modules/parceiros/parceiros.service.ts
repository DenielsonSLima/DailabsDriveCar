import { supabase } from '../../lib/supabase';
import { IParceiro, IParceirosResponse, IParceirosStats, ParceiroTab, ParceiroSchema } from './parceiros.types';

const TABLE = 'parceiros';

export const ParceirosService = {
  async getAll(params: { page: number; limit: number; search?: string; tab?: ParceiroTab }): Promise<IParceirosResponse> {
    const { page, limit, search, tab } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from(TABLE)
      .select('id, nome, documento, cidade, uf, tipo, ativo, pessoa_tipo, telefone, whatsapp, logradouro, numero, bairro, cep', { count: 'exact' });

    // Filtros de Texto (Busca)
    if (search) {
      const searchClean = search.trim();
      // Busca por nome ou documento
      query = query.or(`nome.ilike.%${searchClean}%,documento.ilike.%${searchClean}%,cidade.ilike.%${searchClean}%`);
    }

    // Filtros de Aba (Tab)
    if (tab) {
      switch (tab) {
        case 'ativos':
          query = query.eq('ativo', true);
          break;
        case 'clientes':
          query = query.eq('ativo', true).in('tipo', ['CLIENTE', 'AMBOS']);
          break;
        case 'fornecedores':
          query = query.eq('ativo', true).in('tipo', ['FORNECEDOR', 'AMBOS']);
          break;
        case 'inativos':
          query = query.eq('ativo', false);
          break;
      }
    }

    // Ordenação e Paginação
    const { data, error, count } = await query
      .order('nome', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar parceiros:', error);
      throw new Error('Falha ao carregar dados do servidor.');
    }

    const totalCount = count || 0;

    return {
      data: (data as IParceiro[]) || [],
      count: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  async getAllForSelect(): Promise<IParceiro[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, nome, documento, cep, logradouro, numero, bairro, cidade, uf, complemento, tipo, ativo')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar parceiros para seleção:', error);
      return [];
    }
    return data as IParceiro[];
  },

  async getStats(): Promise<IParceirosStats> {
    const { data, error } = await supabase.rpc('get_parceiros_stats');

    if (error) {
      console.error('Erro ao buscar estatísticas via RPC:', error);
      return { total: 0, ativos: 0, clientes: 0, fornecedores: 0, inativos: 0 };
    }

    return data as IParceirosStats;
  },

  async save(payload: Partial<IParceiro>): Promise<IParceiro> {
    // Validate with Zod
    const validatedData = ParceiroSchema.parse(payload);
    const { id, created_at, updated_at, user_id, organization_id, ...rest } = validatedData;

    const dataToSave: any = {
      ...rest,
      updated_at: new Date().toISOString()
    };

    if (id) {
      dataToSave.id = id;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(dataToSave)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar parceiro:', error);
      throw new Error(error.message);
    }

    return data as IParceiro;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir:', error);
      throw new Error(error.message);
    }
    return true;
  },

  async toggleStatus(id: string, currentStatus: boolean): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ ativo: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Erro ao alterar status:', error);
      throw new Error(error.message);
    }
  },

  async checkDocumentExists(documento: string, excludeId?: string): Promise<boolean> {
    const cleanDoc = documento.replace(/\D/g, '');
    let query = supabase
      .from(TABLE)
      .select('id')
      .eq('documento', cleanDoc);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) return false;
    return !!data;
  },

  async consultarCNPJ(cnpj: string) {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return null;

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error("Erro na API de CNPJ", e);
      return null;
    }
  },


  subscribe(onUpdate: (payload: any) => void) {
    const channelName = `realtime:parceiros:${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLE
        },
        (payload) => {
          console.debug('[Realtime] Mudança detectada em parceiros:', payload.eventType);
          onUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[Realtime] Inscrito com sucesso no canal de parceiros');
        }
      });

    return channel;
  }
};