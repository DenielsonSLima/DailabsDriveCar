
import { supabase } from '../../../lib/supabase';
import { ICor } from './cores.types';

const TABLE = 'cad_cores';

export const CoresService = {
  async getAll(onlyActive = true): Promise<ICor[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('nome', { ascending: true });

    if (onlyActive) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar cores:', error);
      return [];
    }
    return data as ICor[];
  },

  async save(payload: Partial<ICor>): Promise<ICor> {
    const dataToSave = {
      ...payload,
      updated_at: new Date().toISOString()
    };

    if (!payload.id) {
      (dataToSave as any).ativo = true;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(dataToSave)
      .select()
      .single();

    if (error) throw error;
    return data as ICor;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async reactivate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .update({ ativo: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('public:cad_cores_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        () => onUpdate()
      )
      .subscribe();
  }
};
