import { supabase } from '../../lib/supabase';
import { StorageService } from '../../lib/storage.service';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { ITitulo } from '../financeiro/financeiro.types';
import { IVeiculo, IVeiculoDespesa, IEstoqueFilters, IEstoqueResponse, IVeiculoFoto, VeiculoSchema } from './estoque.types';
import { EstVeiculosDespesasService } from './est-veiculos-despesas.service';
import { EmpresaService } from '../ajustes/empresa/empresa.service';

const TABLE = 'est_veiculos';

// Os aliases de busca preservam os relacionamentos completos usados pelos cards.
function createFilteredQuery(orgId: string, filters: IEstoqueFilters | undefined, selection: string, count = false) {
  const search = filters?.search?.trim();
  const searchRelations = search ? `,
    busca_montadora:cad_montadoras(),
    busca_modelo:cad_modelos(),
    busca_versao:cad_versoes()
  ` : '';

  let query = supabase.from(TABLE)
    .select(selection + searchRelations, count ? { count: 'exact' } : {})
    .eq('organization_id', orgId);

  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    query = query
      .ilike('busca_montadora.nome', pattern)
      .ilike('busca_modelo.nome', pattern)
      .ilike('busca_versao.nome', pattern)
      .or(`placa.ilike.${JSON.stringify(pattern)},busca_montadora.not.is.null,busca_modelo.not.is.null,busca_versao.not.is.null`);
  }

  if (filters?.montadoraId) query = query.eq('montadora_id', filters.montadoraId);
  if (filters?.tipoId) query = query.eq('tipo_veiculo_id', filters.tipoId);
  if (filters?.statusTab === 'DISPONIVEL') query = query.eq('status', 'DISPONIVEL');
  else if (filters?.statusTab === 'RASCUNHO') query = query.eq('status', 'PREPARACAO');

  return query;
}

function emptyDashboardStats() {
  return {
    totalVenda: 0, totalCustoBase: 0, totalServicos: 0, totalInvestido: 0,
    ticketMedioVenda: 0, count: 0, socioStats: []
  };
}

// Com texto, os indicadores compartilham o filtro da lista. Lemos apenas os
// campos necessários, em lotes, incluindo todas as páginas do resultado.
async function getSearchedDashboardStats(filters: IEstoqueFilters) {
  const orgId = await EmpresaService.getCurrentOrganizationId();
  const stats = emptyDashboardStats();
  if (!orgId) return stats;

  const partners = new Map<string, { nome: string; totalValor: number; count: number }>();
  const batchSize = 500;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await createFilteredQuery(orgId, filters,
      'valor_venda, valor_custo, valor_custo_servicos, is_consignado, socios')
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1)
      .returns<Pick<IVeiculo, 'valor_venda' | 'valor_custo' | 'valor_custo_servicos' | 'is_consignado' | 'socios'>[]>();
    if (error) throw error;

    const rows = data || [];
    for (const vehicle of rows) {
      // Mesma regra da RPC: consignados investem apenas os serviços; o rateio
      // considera o percentual do sócio sobre o investimento atualizado.
      const baseCost = vehicle.is_consignado ? 0 : Number(vehicle.valor_custo || 0);
      const services = Number(vehicle.valor_custo_servicos || 0);
      const invested = baseCost + services;
      stats.count += 1;
      stats.totalVenda += Number(vehicle.valor_venda || 0);
      stats.totalCustoBase += baseCost;
      stats.totalServicos += services;
      stats.totalInvestido += invested;
      for (const partner of vehicle.socios || []) {
        const key = JSON.stringify([partner.socio_id, partner.nome]);
        const entry = partners.get(key) || { nome: partner.nome, totalValor: 0, count: 0 };
        entry.totalValor += invested * Number(partner.porcentagem || 0) / 100;
        entry.count += 1;
        partners.set(key, entry);
      }
    }
    if (rows.length < batchSize) break;
  }

  return {
    ...stats,
    ticketMedioVenda: stats.count ? stats.totalVenda / stats.count : 0,
    socioStats: Array.from(partners.values()).map(partner => ({
      ...partner,
      percent: stats.totalInvestido > 0 ? partner.totalValor / stats.totalInvestido * 100 : 0
    })).sort((a, b) => b.totalValor - a.totalValor)
  };
}

export const EstoqueService = {
  async getAll(filters?: IEstoqueFilters): Promise<IEstoqueResponse> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const orgId = await EmpresaService.getCurrentOrganizationId();

    if (!orgId) {
      return { data: [], count: 0, currentPage: page, totalPages: 0 };
    }

    const query = createFilteredQuery(orgId, filters, `
        *,
        montadora:cad_montadoras(nome, logo_url),
        modelo:cad_modelos(nome),
        versao:cad_versoes(nome, motorizacao, combustivel, transmissao, ano_fabricacao, ano_modelo),
        tipo_veiculo:cad_tipos_veiculos(nome),
        pedido_compra:cmp_pedidos!est_veiculos_pedido_id_fkey(forma_pagamento:cad_formas_pagamento(nome))
      `, true).is('lote_id', null);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
      .returns<IVeiculo[]>();

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
    if (filters?.search?.trim()) {
      return getSearchedDashboardStats(filters);
    }

    const { data, error } = await supabase.rpc('get_estoque_dashboard_stats', {
      p_search: null,
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
    const orgId = await EmpresaService.getCurrentOrganizationId();

    if (!orgId) return null;

    let query = supabase
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
      .eq('organization_id', orgId)

    const { data, error } = await query
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
        categoria_nome: d.categoria?.nome,
        data: d.data ? d.data.split('T')[0] : d.data,
        data_vencimento: d.data_vencimento ? d.data_vencimento.split('T')[0] : d.data_vencimento
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
      valor_total_investido,
      valor_lucro_estimado,
      valor_margem_estimada,
      ...rest
    } = validatedVeiculo as any;

    const resolvedOrgId = organization_id || (await EmpresaService.getCurrentOrganizationId());

    const dataToSave = {
      ...rest,
      organization_id: resolvedOrgId,
      updated_at: new Date().toISOString()
    };

    // As fotos agora são pré-processadas no frontend (PhotoUpload) para evitar payloads pesados
    // e garantir upload imediato para o Storage. O banco recebe apenas as URLs.
    if (dataToSave.fotos && Array.isArray(dataToSave.fotos)) {
      dataToSave.fotos = dataToSave.fotos.filter(p => p.url && !p.url.startsWith('blob:'));
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
