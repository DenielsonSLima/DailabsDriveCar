import { supabase } from '../../lib/supabase';
import { EmpresaService } from '../ajustes/empresa/empresa.service';
import { TituloReceberSchema, type ITituloReceber } from '../financeiro/submodules/contas-receber/contas-receber.types';

export const LoteFinanceiroService = {
  async getRecebimento(loteId: string, tituloId: string): Promise<ITituloReceber> {
    const organizationId = await EmpresaService.getCurrentOrganizationId();
    if (!organizationId) throw new Error('Selecione uma empresa para continuar.');
    const { data, error } = await supabase.from('fin_titulos').select(`
      *, parceiro:parceiros(nome, documento), categoria:fin_categorias(nome),
      transacoes:fin_transacoes(id, valor, tipo, tipo_transacao, conta_origem_id, data_pagamento,
        conta:fin_contas_bancarias(titular, conta, agencia, banco_nome))
    `).eq('organization_id', organizationId).eq('lote_id', loteId).eq('id', tituloId)
      .eq('tipo', 'RECEBER').eq('origem_tipo', 'PEDIDO_VENDA').neq('status', 'CANCELADO').single();
    if (error) throw new Error('Não foi possível carregar o histórico deste recebimento.');
    return TituloReceberSchema.parse(data) as ITituloReceber;
  },
};
