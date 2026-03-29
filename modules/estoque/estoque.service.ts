import { supabase } from '../../lib/supabase';
import { StorageService } from '../../lib/storage.service';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { ITitulo } from '../financeiro/financeiro.types';
import { IVeiculo, IVeiculoDespesa, IEstoqueFilters, IEstoqueResponse, IVeiculoFoto, VeiculoSchema } from './estoque.types';
import { EstVeiculosDespesasService } from './est-veiculos-despesas.service';

const TABLE = 'est_veiculos';

export const EstoqueService = {
  async getAll(filters?: IEstoqueFilters): Promise<IEstoqueResponse> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from(TABLE)
      .select(`
        *,
        montadora:cad_montadoras(nome, logo_url),
        modelo:cad_modelos(nome),
        versao:cad_versoes(nome, motorizacao, combustivel, transmissao, ano_fabricacao, ano_modelo),
        tipo_veiculo:cad_tipos_veiculos(nome),
        pedido_compra:cmp_pedidos!est_veiculos_pedido_id_fkey(forma_pagamento:cad_formas_pagamento(nome))
      `, { count: 'exact' });

    // Aplicar Filtros
    if (filters) {
      if (filters.search) {
        // Busca simples por placa (pode ser expandido via RPC se necessário)
        query = query.ilike('placa', `%${filters.search}%`);
      }
      if (filters.montadoraId) query = query.eq('montadora_id', filters.montadoraId);
      if (filters.tipoId) query = query.eq('tipo_veiculo_id', filters.tipoId);

      if (filters.statusTab) {
        if (filters.statusTab === 'DISPONIVEL') query = query.eq('status', 'DISPONIVEL');
        else if (filters.statusTab === 'RASCUNHO') query = query.eq('status', 'PREPARACAO');
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar estoque:', error);
      throw error;
    }

    const totalCount = count || 0;

    return {
      data: (data || []) as IVeiculo[],
      count: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  async getDashboardStats(filters?: IEstoqueFilters): Promise<any> {
    const { data, error } = await supabase.rpc('get_estoque_dashboard_stats', {
      p_search: filters?.search || null,
      p_montadora_id: filters?.montadoraId || null,
      p_tipo_id: filters?.tipoId || null,
      p_status: filters?.statusTab || null
    });

    if (error) {
      console.error('Erro ao buscar estatísticas via RPC:', error);
      return {
        totalVenda: 0,
        totalCustoBase: 0,
        totalServicos: 0,
        totalInvestido: 0,
        ticketMedioVenda: 0,
        count: 0,
        socioStats: []
      };
    }
    return data;
  },

  async getById(id: string): Promise<IVeiculo | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        montadora:cad_montadoras(nome, logo_url),
        modelo:cad_modelos(nome),
        versao:cad_versoes(nome),
        tipo_veiculo:cad_tipos_veiculos(nome),
        pedido_compra:cmp_pedidos!est_veiculos_pedido_id_fkey(forma_pagamento:cad_formas_pagamento(nome)),
        despesas:est_veiculos_despesas(
          *,
          categoria:fin_categorias(nome),
          conta_bancaria:fin_contas_bancarias(banco_nome),
          pagamentos:est_veiculos_despesas_pagamentos(
            *,
            conta_bancaria:fin_contas_bancarias(banco_nome, conta),
            forma_pagamento:cad_formas_pagamento(nome)
          )
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar veículo por ID:', error);
      return null;
    }

    const veiculo = data as any;
    if (!veiculo) return null;

    if (veiculo.despesas) {
      veiculo.despesas = veiculo.despesas.map((d: any) => ({
        ...d,
        categoria_nome: d.categoria?.nome
      }));
    }

    return veiculo as IVeiculo;
  },

  async save(payload: Partial<IVeiculo>): Promise<IVeiculo> {
    // Validate with Zod
    // Validate: use partial for updates, full for inserts
    // Note: Zod's .partial() still applies .default() values if they exist in the original schema.
    // For updates, we want to skip defaults to avoid corrupting existing data.
    const schema = payload.id
      ? VeiculoSchema.partial() // We need to be careful with defaults here
      : VeiculoSchema;

    let validatedVeiculo = schema.parse(payload);

    // If it's an update, we MUST ensure we don't overwrite with defaults if the key wasn't in the payload
    if (payload.id) {
      // Filter out keys that were not in the original payload to prevent Zod defaults from leaking in
      const payloadKeys = Object.keys(payload);
      validatedVeiculo = Object.fromEntries(
        Object.entries(validatedVeiculo).filter(([key]) => payloadKeys.includes(key))
      ) as any;
    }


    const {
      id,
      montadora,
      modelo,
      versao,
      tipo_veiculo,
      created_at,
      updated_at,
      despesas,
      user_id,
      organization_id,
      ...rest
    } = validatedVeiculo as any;

    const dataToSave = {
      ...rest,
      updated_at: new Date().toISOString()
    };

    // Processamento de Imagens (Base64 -> Storage) com Upload Paralelo Otimizado
    if (dataToSave.fotos && Array.isArray(dataToSave.fotos)) {
      const uploadPromises = dataToSave.fotos.map(async (photo: any) => {
        if (photo.url && photo.url.startsWith('data:')) {
          try {
            const file = StorageService.base64ToFile(photo.url, `vehicle-photo-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);
            const publicUrl = await StorageService.uploadImage(file, 'veiculos');
            return { ...photo, url: publicUrl };
          } catch (err) {
            console.error('Erro crítico ao fazer upload de foto de veículo para o Storage:', err);
            // Retorna null para sinalizar falha no upload e não persistir Base64 no banco
            return null;
          }
        }
        return photo;
      });

      const processedPhotos = await Promise.all(uploadPromises);

      // Filtra fotos que falharam no upload (null)
      dataToSave.fotos = processedPhotos.filter(p => p !== null);

      // Se o usuário enviou fotos novas (Base64) e todas falharam, talvez seja melhor interromper
      // para evitar que ele ache que salvou as fotos quando na verdade não salvou nada.
      const sentBase64 = payload.fotos?.some((p: any) => p.url?.startsWith('data:'));
      if (sentBase64 && dataToSave.fotos.length === 0 && payload.fotos!.length > 0) {
        throw new Error('Falha ao processar e fazer upload das imagens para o servidor de arquivos. O registro não foi salvo.');
      }
    }

    let query;
    if (id) {
      query = supabase
        .from(TABLE)
        .update(dataToSave)
        .eq('id', id);
    } else {
      query = supabase
        .from(TABLE)
        .insert(dataToSave);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Erro ao salvar veículo:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('O registro foi salvo mas o banco não retornou os dados. Verifique as políticas de RLS.');
    }

    return data[0] as IVeiculo;
  },

  async saveExpensesBatch(veiculoId: string, expenses: Partial<IVeiculoDespesa>[]): Promise<void> {
    const { error } = await supabase.rpc('salvar_lote_despesas', {
      p_veiculo_id: veiculoId,
      p_despesas: expenses
    });

    if (error) {
      console.error('Erro ao salvar lote de despesas via RPC:', error);
      throw error;
    }
  },

  async deleteExpense(id: string): Promise<void> {
    const { data: exp } = await supabase.from('est_veiculos_despesas').select('veiculo_id').eq('id', id).single();
    if (!exp) return;

    const { error } = await supabase.rpc('excluir_despesa_veiculo', {
      p_id: id,
      p_veiculo_id: exp.veiculo_id
    });

    if (error) {
      console.error('Erro ao excluir despesa via RPC:', error);
      throw error;
    }
  },

  async updateExpense(id: string, payload: Partial<IVeiculoDespesa>): Promise<void> {
    // Delega ao EstVeiculosDespesasService que usa a RPC salvar_despesa_veiculo
    // Garante consistência: save(), delete() e agora update() todos passam pela mesma RPC
    await EstVeiculosDespesasService.save({ ...payload, id });
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  /**
   * Real-time subscription for stock changes
   */
  subscribe(onUpdate: () => void) {
    return supabase
      .channel('est_veiculos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onUpdate())
      .subscribe();
  }
};