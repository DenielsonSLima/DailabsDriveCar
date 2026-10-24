import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { EmpresaService } from '../ajustes/empresa/empresa.service';
import type { ILoteCatalogos, ILoteDespesaInput, ILoteDetalhes, ILoteResumo, ILoteVendaInput } from './lotes.types';

async function rpc<T>(name: string, parameters: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) throw new Error(error.message);
  return data as T;
}

export const LotesService = {
  async listar(pedidoId?: string, filters?: { search?: string; statusTab?: string; montadoraId?: string; tipoId?: string }): Promise<ILoteResumo[]> {
    const orgId = await EmpresaService.getCurrentOrganizationId();
    if (!orgId) return [];
    const rows = await rpc<ILoteResumo[]>('listar_lotes', { p_pedido_id: pedidoId || null,
      p_search: filters?.search?.trim() || null, p_status: filters?.statusTab || null,
      p_montadora_id: filters?.montadoraId || null, p_tipo_id: filters?.tipoId || null });
    return (rows || []).filter(row => row.organization_id === orgId);
  },
  async getById(id: string): Promise<ILoteDetalhes> {
    const result = await rpc<ILoteDetalhes | null>('get_lote_detalhes', { p_lote_id: id });
    if (!result?.lote) throw new Error('Lote não encontrado ou acesso indisponível.');
    return result;
  },
  criar({ veiculoId, quantidade, descricao }: { veiculoId: string; quantidade: number; descricao: string }) {
    return rpc<string>('criar_lote', { p_veiculo_id: veiculoId, p_quantidade: quantidade, p_descricao: descricao });
  },
  registrarDespesa(loteId: string, dados: ILoteDespesaInput, requestId: string) {
    return rpc<string>('registrar_despesa_lote', { p_lote_id: loteId, p_dados: dados, p_request_id: requestId });
  },
  registrarVenda(loteId: string, dados: ILoteVendaInput, requestId: string) {
    return rpc<string>('registrar_venda_lote', { p_lote_id: loteId, p_dados: dados, p_request_id: requestId });
  },
  async cancelarVenda(vendaId: string): Promise<void> {
    await rpc('cancelar_venda_lote', { p_venda_id: vendaId });
  },
  async encerrar(loteId: string): Promise<void> {
    await rpc('encerrar_lote', { p_lote_id: loteId });
  },
  async identificarUnidade({ veiculoId, chassi, placa }: { veiculoId: string; chassi?: string; placa?: string }): Promise<void> {
    await rpc('identificar_unidade_lote', { p_veiculo_id: veiculoId, p_chassi: chassi?.trim() || null,
      p_placa: placa?.trim() || null });
  },
  async baixarTitulo({ tituloId, valor, contaId, formaId, data, requestId }: {
    tituloId: string; valor: number; contaId: string; formaId: string; data: string; requestId?: string;
  }): Promise<void> {
    await rpc('baixar_titulo_lote', { p_titulo_id: tituloId, p_valor: valor, p_conta_id: contaId,
      p_forma_pagamento_id: formaId, p_data_pagamento: data, p_request_id: requestId || crypto.randomUUID() });
  },
  async getCatalogos(): Promise<ILoteCatalogos> {
    const orgId = await EmpresaService.getCurrentOrganizationId();
    if (!orgId) throw new Error('Selecione uma empresa para continuar.');
    const results = await Promise.allSettled([
      supabase.from('parceiros').select('id,nome,tipo').eq('organization_id', orgId).eq('ativo', true).order('nome'),
      supabase.from('fin_categorias').select('id,nome').eq('organization_id', orgId).eq('natureza', 'SAIDA').eq('tipo', 'VARIAVEL').order('nome'),
      supabase.from('fin_contas_bancarias').select('id,banco_nome,conta,titular').eq('organization_id', orgId).eq('ativo', true).order('banco_nome'),
      supabase.from('cad_formas_pagamento').select('id,nome,tipo_movimentacao,destino_lancamento')
        .or(`organization_id.eq.${orgId},organization_id.is.null`).eq('ativo', true).order('nome'),
    ]);
    const rows = results.map(result => {
      if (result.status === 'rejected') throw result.reason;
      if (result.value.error) throw new Error(result.value.error.message);
      return result.value.data || [];
    });
    return { parceiros: rows[0], categorias: rows[1], contas: rows[2], formas: rows[3] } as ILoteCatalogos;
  },
  subscribe(loteId: string, onChange: () => void): () => void {
    const channel = supabase.channel(`lote-${loteId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'est_veiculos', filter: `lote_id=eq.${loteId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_titulos' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venda_pedidos', filter: `lote_id=eq.${loteId}` }, onChange)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  },
};

export async function invalidarLotes(client: QueryClient, _loteId?: string, _pedidoId?: string): Promise<void> {
  // Uma única invalidação evita cancelar e repetir os mesmos requests ativos.
  await client.invalidateQueries({ predicate: query =>
    /lote|financeiro|caixa|contas|despesa|venda|pedido|inicio|estoque/.test(String(query.queryKey[0])) });
}
