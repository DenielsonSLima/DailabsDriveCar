
import { supabase } from '../../../lib/supabase';
import { IMotorizacao } from './motorizacao.types';

const TABLE = 'cad_motorizacao';

export const MotorizacaoService = {
  async getAll(onlyActive = true): Promise<IMotorizacao[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('nome', { ascending: true });

    if (onlyActive) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar motorizações:', error);
      return [];
    }
    return data as IMotorizacao[];
  },

  async save(payload: Partial<IMotorizacao>): Promise<IMotorizacao> {
    const dataToSave: any = {
      ...payload,
      updated_at: new Date().toISOString()
    };

    if (!payload.id) {
      dataToSave.ativo = true;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(dataToSave)
      .select()
      .single();

    if (error) throw error;
    return data as IMotorizacao;
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
      .channel('public:cad_motorizacao_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        () => onUpdate()
      )
      .subscribe();
  }
};
