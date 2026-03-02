
import { supabase } from '../../../lib/supabase';
import { IContaBancaria } from './contas.types';

const TABLE = 'fin_contas_bancarias';

export const ContasBancariasService = {
  async getAll(): Promise<IContaBancaria[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('ativo', { ascending: false }) // Ativos primeiro
      .order('banco_nome', { ascending: true });

    if (error) throw error;
    return data as IContaBancaria[];
  },

  async save(payload: Partial<IContaBancaria>): Promise<IContaBancaria> {
    const dataToSave = {
      ...payload,
      updated_at: new Date().toISOString()
    };
    if (!dataToSave.id) delete dataToSave.id;

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(dataToSave)
      .select()
      .single();

    if (error) throw error;
    return data as IContaBancaria;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async toggleStatus(id: string, novoStatus: boolean): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  // Atualiza especificamente o saldo inicial e a data de corte
  async setSaldoInicial(id: string, valor: number, dataReferencia: string): Promise<void> {
    const { error } = await supabase.rpc('ajustar_saldo_inicial', {
      p_conta_id: id,
      p_novo_saldo_inicial: valor,
      p_data_referencia: dataReferencia
    });

    if (error) {
      console.error('Erro ao ajustar saldo inicial via RPC:', error);
      throw error;
    }
  },

  subscribe(onUpdate: (eventType: string) => void) {
    return supabase
      .channel('public:fin_contas_bancarias_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        (payload) => onUpdate(payload.eventType)
      )
      .subscribe();
  }
};
