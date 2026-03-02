import { supabase } from '../../../../lib/supabase';
import { ITransferencia, TransferenciaTab } from './transferencias.types';

const TABLE = 'fin_transferencias';

export const TransferenciasService = {
  async getAll(tab: TransferenciaTab): Promise<ITransferencia[]> {
    let query = supabase
      .from(TABLE)
      .select(`
        *,
        conta_origem:fin_contas_bancarias!fin_transferencias_conta_origem_id_fkey(banco_nome, conta, titular),
        conta_destino:fin_contas_bancarias!fin_transferencias_conta_destino_id_fkey(banco_nome, conta, titular)
      `);

    if (tab === 'MES_ATUAL') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      query = query.gte('data', firstDay).lte('data', lastDay);
    }

    const { data, error } = await query.order('data', { ascending: false });
    if (error) throw error;
    return data as ITransferencia[];
  },

  async save(payload: Partial<ITransferencia>): Promise<void> {
    const { error } = await supabase.rpc('salvar_transferencia', {
      p_id: payload.id || null,
      p_origem_id: payload.conta_origem_id,
      p_destino_id: payload.conta_destino_id,
      p_valor: payload.valor,
      p_descricao: payload.descricao || 'Transferência Interna',
      p_data: payload.data
    });

    if (error) {
      console.error('Erro ao salvar transferência via RPC:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.rpc('excluir_transferencia', { p_id: id });
    if (error) {
      console.error('Erro ao excluir transferência via RPC:', error);
      throw error;
    }
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('fin_transferencias_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onUpdate())
      .subscribe();
  }
};
