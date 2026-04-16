
import { supabase } from '../../lib/supabase';

export const CadastrosMasterService = {
  getStorageKey(submodule: string) {
    return `nexus_cadastros_${submodule}`;
  },

  async getFromDB(table: string, onlyActive = true) {
    let query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (onlyActive) {
      query = query.eq('ativo', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Erro ao buscar dados de ${table}:`, error);
      return [];
    }
    return data;
  },

  async saveToDB(table: string, payload: any) {
    const { data, error } = await supabase
      .from(table)
      .upsert({ ...payload, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      console.error(`Erro ao salvar em ${table}:`, error);
      throw error;
    }
    return data;
  },

  async deleteFromDB(table: string, id: string) {
    // Agora fazemos Soft Delete por padrão
    const { error } = await supabase
      .from(table)
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(`Erro ao inativar em ${table}:`, error);
      throw error;
    }
    return true;
  },

  async reactivateInDB(table: string, id: string) {
    const { error } = await supabase
      .from(table)
      .update({ ativo: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(`Erro ao reativar em ${table}:`, error);
      throw error;
    }
    return true;
  }
};
