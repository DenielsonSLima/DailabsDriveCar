import type { ILoteDetalhes } from './lotes.types';

/** Preview only. The RPC validates and performs the authoritative allocation. */
export function calcularRateioAquisicao(total: number, quantidade: number) {
  const centavos = Math.round(Number(total) * 100);
  if (!Number.isInteger(quantidade) || quantidade < 2 || quantidade > 10000
    || !Number.isSafeInteger(centavos) || centavos < 0) return null;
  const base = Math.floor(centavos / quantidade);
  const extras = centavos % quantidade;
  return {
    total: centavos / 100,
    quantidade,
    valorBase: base / 100,
    quantidadeBase: quantidade - extras,
    valorExtra: (base + 1) / 100,
    quantidadeExtra: extras,
  };
}

export function atualizarDescricaoQuantidade(descricao: string, anterior: number, quantidade: number): string {
  // Only change the quantity in the conventional title, never unrelated numbers.
  return descricao.replace(new RegExp(`^(\\s*lote\\s+de\\s+)${anterior}(?=\\s)`, 'i'), `$1${quantidade}`);
}

export function bloqueioAjusteQuantidade(detalhes: ILoteDetalhes): string | null {
  if (detalhes.lote.encerrado) return 'O lote está encerrado.';
  if (detalhes.vendas.length) return 'A quantidade não pode ser alterada após registrar uma venda, mesmo cancelada.';
  return null;
}
