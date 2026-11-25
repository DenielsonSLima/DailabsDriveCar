import type { IVeiculo } from '../estoque/estoque.types';
import { ENTRADA_LOTE_DESCRICAO_MAX, ENTRADA_LOTE_MAX, type EntradaLoteInput } from './pedidos-compra.types';

export const isQuantidadeLoteValida = (value: number) =>
  Number.isInteger(value) && value >= 2 && value <= ENTRADA_LOTE_MAX;

export const isDescricaoLoteValida = (value: string) =>
  value.trim().length > 0 && value.trim().length <= ENTRADA_LOTE_DESCRICAO_MAX;

export function getEntradaLote(veiculo?: Partial<IVeiculo> | null): EntradaLoteInput | undefined {
  const quantidade = veiculo?.entrada_lote_quantidade;
  const descricao = veiculo?.entrada_lote_descricao;
  if (!veiculo?.lote_id && typeof quantidade === 'number' && isQuantidadeLoteValida(quantidade) &&
    typeof descricao === 'string' && isDescricaoLoteValida(descricao)) {
    return { quantidade, descricao: descricao.trim() };
  }
}
