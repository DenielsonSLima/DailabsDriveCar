import type { ILoteDetalhes } from './lotes.types';
import { getTituloPendente } from './lotes.utils';

export type LoteFinanceiroFiltro = 'EM_ABERTO' | 'QUITADOS' | 'TODOS';

/** Exige vínculo explícito ao lote e a uma venda confirmada. Não agrega parcelas. */
export function getRecebiveisLote(detalhes: ILoteDetalhes, filtro: LoteFinanceiroFiltro = 'EM_ABERTO') {
  const vendas = new Map(detalhes.vendas.filter(venda => venda.lote_id === detalhes.lote.id
    && venda.status === 'CONCLUIDO').map(venda => [venda.id, venda]));
  return detalhes.titulos.filter(titulo => titulo.lote_id === detalhes.lote.id
    && titulo.tipo === 'RECEBER' && titulo.origem_tipo === 'PEDIDO_VENDA'
    && titulo.status !== 'CANCELADO' && vendas.has(titulo.venda_pedido_id || ''))
    .filter(titulo => filtro === 'TODOS' || (filtro === 'EM_ABERTO'
      ? getTituloPendente(titulo) > 0 : getTituloPendente(titulo) === 0))
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento) || a.id.localeCompare(b.id))
    .map(titulo => ({ titulo, venda: vendas.get(titulo.venda_pedido_id!)!, pendente: getTituloPendente(titulo) }));
}
