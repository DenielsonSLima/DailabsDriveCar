import { supabase } from '../../../lib/supabase';

export const TransferenciasService = {
  async realizarTransferencia(payload: { origem: string, destino: string, valor: number, obs?: string }): Promise<void> {
    const { error } = await supabase.rpc('salvar_transferencia', {
      p_id: null,
      p_origem_id: payload.origem,
      p_destino_id: payload.destino,
      p_valor: payload.valor,
      p_descricao: payload.obs || 'Transferência Interna',
      p_data: new Date().toISOString().split('T')[0]
    });

    if (error) {
      console.error('Erro ao realizar transferência via RPC:', error);
      throw error;
    }
  }
};
