/**
 * Service modular para Pagamentos de Despesas de Veículos
 * Tabela: est_veiculos_despesas_pagamentos
 *
 * Separado da despesa em si — permite múltiplos pagamentos parciais
 * e integra com o financeiro via fin_titulos + fin_transacoes.
 */
import { supabase } from '../../lib/supabase';
import { FinanceiroService } from '../financeiro/financeiro.service';
import { ITitulo } from '../financeiro/financeiro.types';
import { EstVeiculosDespesasService } from './est-veiculos-despesas.service';

// ─── Types ──────────────────────────────────────────────────────
export interface IDespesaPagamento {
    id: string;
    despesa_id: string;
    conta_bancaria_id?: string;
    forma_pagamento_id?: string;
    valor: number;
    data_pagamento: string;
    observacao?: string;
    created_at?: string;
    // Joins
    conta_bancaria?: { banco_nome: string; conta: string };
    forma_pagamento?: { nome: string };
}

// ─── Service ────────────────────────────────────────────────────
const TABLE = 'est_veiculos_despesas_pagamentos';

export const EstVeiculosDespesasPagamentosService = {
    /**
     * Lista todos os pagamentos de uma despesa
     */
    async getByDespesaId(despesaId: string): Promise<IDespesaPagamento[]> {
        const { data, error } = await supabase
            .from(TABLE)
            .select(`
        *,
        conta_bancaria:fin_contas_bancarias(banco_nome, conta),
        forma_pagamento:cad_formas_pagamento(nome)
      `)
            .eq('despesa_id', despesaId)
            .order('data_pagamento', { ascending: true });

        if (error) throw error;
        return (data || []) as IDespesaPagamento[];
    },

    /**
     * Registra um pagamento de despesa e integra com o financeiro
     * Este método:
     *   1. Insere o pagamento na tabela de pagamentos
     *   2. Busca/cria o título financeiro vinculado
     *   3. Baixa o título no financeiro (atualiza saldo)
     *   4. Atualiza o status da despesa
     */
    async registrarPagamento(params: {
        despesaId: string;
        contaBancariaId: string;
        formaPagamentoId: string;
        valor: number;
        dataPagamento?: string;
        observacao?: string;
    }): Promise<void> {
        const { error } = await supabase.rpc('registrar_pagamento_despesa', {
            p_despesa_id: params.despesaId,
            p_conta_id: params.contaBancariaId,
            p_forma_id: params.formaPagamentoId,
            p_valor: params.valor,
            p_data_pagamento: params.dataPagamento || new Date().toISOString(),
            p_observacao: params.observacao
        });

        if (error) {
            console.error('Erro ao registrar pagamento via RPC:', error);
            throw error;
        }
    },

    /**
     * Remove um pagamento de despesa
     */
    async removerPagamento(pagamentoId: string, despesaId: string): Promise<void> {
        const { error } = await supabase.rpc('estornar_pagamento_despesa', {
            p_pagamento_id: pagamentoId
        });

        if (error) {
            console.error('Erro ao estornar pagamento de despesa via RPC:', error);
            throw error;
        }
    },

    /**
     * Subscribe para atualizações em tempo real
     */
    subscribe(despesaId: string, onUpdate: () => void) {
        return supabase
            .channel(`est_despesas_pag_${despesaId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: TABLE,
                filter: `despesa_id=eq.${despesaId}`
            }, () => onUpdate())
            .subscribe();
    },
};
