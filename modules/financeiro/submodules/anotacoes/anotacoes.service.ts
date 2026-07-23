import { supabase } from '../../../../lib/supabase';
import { IAnotacao, IAnotacaoForm } from './anotacoes.types';

export const AnotacoesService = {
  /**
   * Retorna todas as anotações da organização do usuário logado
   * Opcional: filtrar por período (data_inicio e data_fim no formato YYYY-MM-DD)
   */
  async getAll(dataInicio?: string, dataFim?: string): Promise<IAnotacao[]> {
    let query = supabase
      .from('fin_anotacoes')
      .select('*')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false });

    if (dataInicio) query = query.gte('data', dataInicio);
    if (dataFim) query = query.lte('data', dataFim);

    const { data, error } = await query;
    if (error) throw error;
    return data as IAnotacao[];
  },

  /**
   * Cria uma nova anotação
   */
  async create(form: IAnotacaoForm): Promise<IAnotacao> {
    const { data: orgData, error: orgError } = await supabase.rpc('get_my_org_id');
    if (orgError) throw orgError;

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      organization_id: orgData,
      data: form.data,
      descricao: form.descricao.trim(),
      valor: form.valor && form.valor.trim() !== '' ? parseFloat(form.valor.replace(',', '.')) : null,
      created_by: user?.id ?? null,
    };

    const { data, error } = await supabase
      .from('fin_anotacoes')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as IAnotacao;
  },

  /**
   * Atualiza uma anotação existente
   */
  async update(id: string, form: IAnotacaoForm): Promise<IAnotacao> {
    const payload = {
      data: form.data,
      descricao: form.descricao.trim(),
      valor: form.valor && form.valor.trim() !== '' ? parseFloat(form.valor.replace(',', '.')) : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fin_anotacoes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as IAnotacao;
  },

  /**
   * Remove uma anotação
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('fin_anotacoes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
