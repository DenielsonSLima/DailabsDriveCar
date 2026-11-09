import type { ICaixaDashboardData } from './caixa.types';

type ComposicaoEstoque = Pick<ICaixaDashboardData,
  'qtd_veiculos_estoque' | 'qtd_veiculos_individuais' | 'qtd_unidades_lotes' | 'qtd_motos_lotes'>;

/** Compartilhado pelo painel e pela impressão, sem inferir categoria pela descrição do lote. */
export function getEstoqueResumo(data: ComposicaoEstoque): string[] {
  const individuais = data.qtd_veiculos_individuais;
  const lotes = data.qtd_unidades_lotes;
  const motos = data.qtd_motos_lotes;
  if (individuais == null || lotes == null || motos == null ||
      individuais + lotes !== data.qtd_veiculos_estoque || motos > lotes) {
    return [`${data.qtd_veiculos_estoque} veículos no total`, 'Separação indisponível'];
  }

  const tipoLote = lotes > 0 && motos === lotes
    ? (lotes === 1 ? 'moto' : 'motos')
    : (lotes === 1 ? 'unidade' : 'unidades');
  return [
    `${individuais} ${individuais === 1 ? 'veículo' : 'veículos'} no estoque individual`,
    `${lotes} ${tipoLote} em lotes`,
  ];
}
