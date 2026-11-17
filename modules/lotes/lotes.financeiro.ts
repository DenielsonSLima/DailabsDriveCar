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

/** One financial contract per sale. Never duplicate a shared debt for multi-unit sales. */
export function getVendasRecebiveisLote(detalhes: ILoteDetalhes, filtro: LoteFinanceiroFiltro = 'EM_ABERTO') {
  const grupos = new Map<string, { id: string; veiculoId?: string; compartilhada: boolean; venda: ILoteDetalhes['vendas'][number]; parcelas: ReturnType<typeof getRecebiveisLote>; pendente: number; recebido: number }>();
  for (const item of getRecebiveisLote(detalhes, 'TODOS')) {
    const compartilhada = (item.venda.quantidade_lote || 1) > 1 && item.venda.modo_financeiro !== 'POR_UNIDADE';
    const veiculoId = compartilhada ? undefined : (item.titulo.veiculo_id || item.venda.itens?.[0]?.veiculo_id);
    const id = veiculoId ? `${item.venda.id}:${veiculoId}` : item.venda.id;
    let grupo = grupos.get(id);
    if (!grupo) {
      grupo = { id, veiculoId, compartilhada, venda: item.venda, parcelas: [], pendente: 0, recebido: 0 };
      grupos.set(id, grupo);
    }
    grupo.parcelas.push(item);
    grupo.pendente = (Math.round(grupo.pendente * 100) + Math.round(item.pendente * 100)) / 100;
    grupo.recebido = (Math.round(grupo.recebido * 100) + Math.round(Number(item.titulo.valor_pago || 0) * 100)) / 100;
  }
  return [...grupos.values()].filter(grupo => filtro === 'TODOS' || (filtro === 'EM_ABERTO' ? grupo.pendente > 0 : grupo.pendente === 0));
}
