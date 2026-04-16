import { supabase } from '../../../lib/supabase';
import { IVersao } from './versoes.types';

const TABLE = 'cad_versoes';

export const VersoesService = {
  async getByModelo(modeloId: string, onlyActive = true): Promise<IVersao[]> {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('modelo_id', modeloId);
    
    if (onlyActive) {
      query = query.eq('ativo', true);
    }
    
    const { data, error } = await query
      .order('ano_modelo', { ascending: false })
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar versões:', error);
      return [];
    }
    return data as IVersao[];
  },

  async checkDuplicate(
    modeloId: string,
    nome: string,
    motorizacao: string,
    combustivel: string,
    transmissao: string,
    anoModelo: number,
    anoFabricacao: number,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('modelo_id', modeloId)
      .eq('nome', nome)
      .eq('motorizacao', motorizacao)
      .eq('combustivel', combustivel)
      .eq('transmissao', transmissao)
      .eq('ano_modelo', anoModelo)
      .eq('ano_fabricacao', anoFabricacao)
      .eq('ativo', true); // Só checa duplicidade contra registros ativos

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count } = await query;
    return (count || 0) > 0;
  },

  async save(payload: Partial<IVersao>): Promise<IVersao> {
    // Validação de duplicidade refinada com todos os critérios técnicos
    const isDup = await this.checkDuplicate(
      payload.modelo_id!,
      payload.nome!,
      payload.motorizacao!,
      payload.combustivel!,
      payload.transmissao!,
      Number(payload.ano_modelo),
      Number(payload.ano_fabricacao),
      payload.id
    );

    if (isDup) {
      throw new Error(`Já existe uma versão cadastrada com exatamente estas características (${payload.nome} ${payload.motorizacao} ${payload.combustivel} ${payload.transmissao} ${payload.ano_fabricacao}/${payload.ano_modelo}).`);
    }

    const cleanData: any = {
      modelo_id: payload.modelo_id,
      nome: payload.nome,
      motorizacao: payload.motorizacao,
      transmissao: payload.transmissao,
      combustivel: payload.combustivel,
      ano_modelo: Number(payload.ano_modelo),
      ano_fabricacao: Number(payload.ano_fabricacao),
      updated_at: new Date().toISOString()
    };

    if (payload.id) {
      cleanData.id = payload.id;
    } else {
      cleanData.ativo = true;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(cleanData)
      .select()
      .single();

    if (error) throw error;
    return data as IVersao;
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

  subscribe(modeloId: string, onUpdate: () => void) {
    return supabase
      .channel(`public:cad_versoes_${modeloId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE, filter: `modelo_id=eq.${modeloId}` },
        () => onUpdate()
      )
      .subscribe();
  }
};