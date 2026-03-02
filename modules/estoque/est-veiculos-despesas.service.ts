/**
 * Service modular para Despesas de Veículos
 * Tabela: est_veiculos_despesas
 *
 * Extraído do estoque.service.ts — gerencia apenas o CRUD de despesas.
 * Pagamentos ficam em est-veiculos-despesas-pagamentos.service.ts
 */
import { supabase } from '../../lib/supabase';
import { IVeiculoDespesa } from './estoque.types';

const TABLE = 'est_veiculos_despesas';
const VEICULOS_TABLE = 'est_veiculos';

export const EstVeiculosDespesasService = {
    /**
     * Lista todas as despesas de um veículo
     */
    async getByVeiculoId(veiculoId: string): Promise<IVeiculoDespesa[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select(`
        *,
        categoria:fin_categorias(nome),
        forma_pagamento:cad_formas_pagamento(nome),
        conta_bancaria:fin_contas_bancarias(banco_nome),
        pagamentos:est_veiculos_despesas_pagamentos(*)
      `)
            .eq('veiculo_id', veiculoId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as any;
    },

    /**
     * Busca uma despesa específica por ID
     */
    async getById(id: string): Promise<IVeiculoDespesa | null> {
        const { data, error } = await supabase
            .from(TABLE)
            .select(`
        *,
        categoria:fin_categorias(nome),
        forma_pagamento:cad_formas_pagamento(nome),
        conta_bancaria:fin_contas_bancarias(banco_nome),
        pagamentos:est_veiculos_despesas_pagamentos(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as any;
    },

    /**
     * Salva uma despesa (insert ou update)
     */
    async save(despesa: Partial<IVeiculoDespesa>): Promise<IVeiculoDespesa> {
        const { id, veiculo_id, tipo, categoria_id, descricao, quantidade, valor_unitario, valor_total, forma_pagamento_id, conta_bancaria_id, data_vencimento, status_pagamento } = despesa;

        const { data, error } = await supabase.rpc('salvar_despesa_veiculo', {
            p_id: id || null,
            p_veiculo_id: veiculo_id,
            p_tipo: tipo,
            p_categoria_id: categoria_id,
            p_descricao: descricao,
            p_quantidade: quantidade,
            p_valor_unitario: valor_unitario,
            p_valor_total: valor_total,
            p_forma_pagamento_id: forma_pagamento_id,
            p_conta_bancaria_id: conta_bancaria_id,
            p_data_vencimento: data_vencimento,
            p_status_pagamento: status_pagamento
        });

        if (error) {
            console.error('Erro ao salvar despesa via RPC:', error);
            throw error;
        }

        return data as IVeiculoDespesa;
    },

    /**
     * Salva um lote de despesas para um veículo
     */
    async saveBatch(veiculoId: string, despesas: Partial<IVeiculoDespesa>[]): Promise<void> {
        for (const desp of despesas) {
            await this.save({ ...desp, veiculo_id: veiculoId });
        }
    },

    /**
     * Remove uma despesa (pagamentos são removidos por CASCADE)
     */
    async delete(id: string, veiculoId: string): Promise<void> {
        const { error } = await supabase.rpc('excluir_despesa_veiculo', {
            p_id: id,
            p_veiculo_id: veiculoId
        });

        if (error) {
            console.error('Erro ao excluir despesa via RPC:', error);
            throw error;
        }
    },

    /**
     * Atualiza o status de pagamento de uma despesa (chamado pelo service de pagamentos)
     */
    async atualizarStatusPagamento(despesaId: string, status: 'PAGO' | 'PENDENTE' | 'PARCIAL'): Promise<void> {
        await supabase
            .from(TABLE)
            .update({ status_pagamento: status })
            .eq('id', despesaId);
    },

    /**
     * Subscribe para atualizações em tempo real
     */
    subscribe(veiculoId: string, onUpdate: () => void) {
        return supabase
            .channel(`est_veiculos_despesas_${veiculoId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: TABLE,
                filter: `veiculo_id=eq.${veiculoId}`
            }, () => onUpdate())
            .subscribe();
    },
};
