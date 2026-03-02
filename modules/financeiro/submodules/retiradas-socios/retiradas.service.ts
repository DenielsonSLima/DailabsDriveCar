
import { supabase } from '../../../../lib/supabase';
import { IRetirada, RetiradaTab, IRetiradaFiltros } from './retiradas.types';

const TABLE = 'fin_retiradas';

export const RetiradasService = {
  async getAll(tab: RetiradaTab, filtros: IRetiradaFiltros): Promise<IRetirada[]> {
    let query = supabase
      .from(TABLE)
      .select(`
        *,
        socio:config_socios(nome, cpf),
        conta_origem:fin_contas_bancarias(banco_nome, conta, titular)
      `);

    if (tab === 'MES_ATUAL') {
      const now = new Date();
      const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      query = query.gte('data', primeiroDia).lte('data', ultimoDia);
    }

    if (filtros.busca) {
      query = query.ilike('descricao', `%${filtros.busca}%`);
    }
    if (filtros.socioId) query = query.eq('socio_id', filtros.socioId);
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.dataInicio) query = query.gte('data', filtros.dataInicio);
    if (filtros.dataFim) query = query.lte('data', filtros.dataFim);

    const { data, error } = await query.order('data', { ascending: false });
    if (error) throw error;
    return data as IRetirada[];
  },

  async getSaldosSocios(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_saldos_socios');
    if (error) {
      console.error('Erro ao buscar saldos dos sócios:', error);
      throw error;
    }
    return data || [];
  },

  async save(payload: Partial<IRetirada>): Promise<void> {
    if (payload.id) {
      const { error } = await supabase.rpc('atualizar_retirada', {
        p_id: payload.id,
        p_socio_id: payload.socio_id,
        p_conta_id: payload.conta_origem_id,
        p_valor: payload.valor,
        p_data: payload.data,
        p_descricao: payload.descricao,
        p_tipo: payload.tipo
      });
      if (error) {
        console.error('Erro ao editar retirada via RPC:', error);
        throw error;
      }
      return;
    }

    const { error } = await supabase.rpc('registrar_retirada', {
      p_socio_id: payload.socio_id,
      p_conta_id: payload.conta_origem_id,
      p_valor: payload.valor,
      p_data: payload.data,
      p_descricao: payload.descricao,
      p_tipo: payload.tipo
    });

    if (error) {
      console.error('Erro ao registrar retirada via RPC:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.rpc('excluir_retirada', { p_id: id });
    if (error) {
      console.error('Erro ao excluir retirada via RPC:', error);
      throw error;
    }
  },

  subscribe(onUpdate: () => void) {
    return supabase
      .channel('fin_retiradas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onUpdate())
      .subscribe();
  }
};
