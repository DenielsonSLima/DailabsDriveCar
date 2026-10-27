import type { ITitulo } from '../financeiro/financeiro.types';
import type { IVeiculo } from '../estoque/estoque.types';

export interface ILote {
  id: string;
  organization_id: string;
  pedido_id: string;
  descricao: string;
  quantidade_inicial: number;
  custo_aquisicao: number;
  encerrado: boolean;
  created_at: string;
}

export interface ILoteUnidade extends IVeiculo {
  lote_id: string;
  lote_ordem: number;
  custo_lote_servicos?: number;
}

export interface ILoteDespesa {
  id: string;
  lote_id: string;
  veiculo_id?: string | null;
  titulo_id: string;
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  categoria_id: string;
  fornecedor_id?: string | null;
  comprovante_url?: string | null;
  created_at: string;
  cancelada?: boolean;
}

export interface ILoteVendaItem {
  venda_id: string;
  veiculo_id: string;
  lote_id: string;
  custo_na_venda: number;
  valor_venda: number;
}

export interface ILoteVenda {
  id: string;
  lote_id: string;
  numero_venda: string;
  cliente_id: string;
  cliente_nome?: string;
  data_venda: string;
  quantidade_lote: number;
  valor_venda: number;
  status: 'RASCUNHO' | 'CONCLUIDO' | 'CANCELADO';
  created_at: string;
  itens?: ILoteVendaItem[];
}

export interface ILoteDetalhes {
  gestao_versao?: number;
  lote: ILote;
  unidades: ILoteUnidade[];
  despesas: ILoteDespesa[];
  vendas: ILoteVenda[];
  titulos: ITitulo[];
  transacoes?: ILoteTransacao[];
  historico?: ILoteHistorico[];
}

export interface ILoteTransacao {
  id: string;
  titulo_id: string;
  conta_origem_id?: string | null;
  conta_nome?: string | null;
  valor: number;
  tipo: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
  tipo_transacao?: string | null;
  data_pagamento: string;
  descricao?: string | null;
  estorno_de_id?: string | null;
}

export interface ILoteHistorico {
  id: string;
  acao: string;
  motivo: string;
  created_at: string;
  antes?: Record<string, unknown> | null;
  depois?: Record<string, unknown> | null;
}

export interface ILoteResumo extends ILote {
  quantidade_disponivel: number;
  quantidade_vendida: number;
}

export interface ILotePagamentoInput {
  valor: number;
  data_recebimento: string;
  forma_pagamento_id: string;
  conta_bancaria_id?: string | null;
}

export interface ILoteVendaInput {
  cliente_id: string;
  veiculo_ids: string[];
  quantidade: number;
  valor_total: number;
  data_venda: string;
  observacoes?: string;
  pagamentos: ILotePagamentoInput[];
  identificacoes?: Array<{ chassi?: string; placa?: string }>;
}

export interface ILoteDespesaInput {
  descricao: string;
  valor_total: number;
  data_vencimento: string;
  categoria_id: string;
  fornecedor_id?: string | null;
  comprovante_url?: string | null;
  veiculo_id?: string | null;
  pago_agora: boolean;
  conta_bancaria_id?: string | null;
  forma_pagamento_id?: string | null;
}

export interface ILoteCatalogos {
  parceiros: Array<{ id: string; nome: string; tipo: string }>;
  categorias: Array<{ id: string; nome: string }>;
  contas: Array<{ id: string; banco_nome: string; conta: string; titular: string }>;
  formas: Array<{ id: string; nome: string; tipo_movimentacao: string; destino_lancamento: string }>;
}

export interface ILoteIndicadores {
  compradas: number;
  disponiveis: number;
  vendidas: number;
  reservadas: number;
  preparacao: number;
  custoAquisicao: number;
  despesas: number;
  custoTotal: number;
  custoMedio: number;
  pago: number;
  aPagar: number;
  vendido: number;
  recebido: number;
  aReceber: number;
  custoVendido: number;
  custoVendidoOriginal: number;
  custoEstoque: number;
  resultado: number;
  resultadoOriginal: number;
  saldoCaixa: number;
}
