import { z } from 'zod';
import { IContaBancaria } from '../ajustes/contas-bancarias/contas.types';
import { ITransacao } from '../financeiro/financeiro.types';

export interface IPendingAccount {
  id: string;
  tipo: 'PAGAR' | 'RECEBER';
  descricao: string;
  data_vencimento: string;
  valor_total: number;
  valor_pago: number;
  valor_desconto?: number;
  valor_acrescimo?: number;
  status: string;
  veiculo_id?: string;
  veiculo?: {
    modelo: string;
    placa: string;
  };
}

export interface IPatrimonioItem {
  id: string;
  descricao: string;
  valor: number;
  data: string;
}

export interface ISocioStockStats {
  socio_id: string;
  nome: string;
  valor_investido: number; // Capital no estoque (Exposição)
  valor_patrimonio_pessoal: number; // Outros bens cadastrados
  porcentagem_estoque: number;
  quantidade_carros: number;
  lucro_periodo: number; // Lucro nas vendas do mês (Competência)
  lucro_caixa: number; // Lucro que efetivamente entrou (Caixa)
  lucro_pendente: number; // Lucro a receber (Futuro)
  porcentagem_participacao?: number;
  total_investido_todos_socios?: number;
  total_patrimonio_liquido_todos?: number;
  veiculos: {
    id: string;
    montadora: string;
    montadora_logo?: string;
    modelo: string;
    versao?: string;
    placa: string;
    valor: number; // Investimento do sócio neste veículo
    valor_total_custo?: number; // Custo total do veículo
    motorizacao?: string;
    cambio?: string;
    combustivel?: string;
    ano_modelo?: number;
    ano_fabricacao?: number;
    imagem?: string;
    descricao?: string;
  }[];
  patrimonio_pessoal: IPatrimonioItem[];
  investimento_por_modelo: {
    modelo: string;
    valor: number;
  }[];
}

export interface ICaixaDashboardData {
  // KPIs Principais
  patrimonio_liquido: number;
  saldo_disponivel: number;
  total_ativos_estoque: number;
  qtd_veiculos_estoque: number;
  total_recebiveis: number;
  total_passivo_circulante: number;
  total_despesas_fixas: number;
  total_despesas_variaveis: number;
  total_entradas: number;
  total_saidas: number;

  // Detalhamento
  contas: IContaBancaria[];
  investimento_socios: ISocioStockStats[];
  transacoes: ITransacao[];

  // Resultados do Período
  total_compras: number;
  total_vendas_recebido: number;
  total_custo_vendas: number; // CMV
  lucro_mensal: number;
  margem_lucro: number;
}

export const CaixaDashboardSchema = z.object({
  patrimonio_liquido: z.number().nullish().transform(v => v ?? 0),
  saldo_disponivel: z.number().nullish().transform(v => v ?? 0),
  total_ativos_estoque: z.number().nullish().transform(v => v ?? 0),
  qtd_veiculos_estoque: z.number().nullish().transform(v => v ?? 0),
  total_recebiveis: z.number().nullish().transform(v => v ?? 0),
  total_passivo_circulante: z.number().nullish().transform(v => v ?? 0),
  total_despesas_fixas: z.number().nullish().transform(v => v ?? 0),
  total_despesas_variaveis: z.number().nullish().transform(v => v ?? 0),
  total_entradas: z.number().nullish().transform(v => v ?? 0),
  total_saidas: z.number().nullish().transform(v => v ?? 0),
  total_compras: z.number().nullish().transform(v => v ?? 0),
  total_vendas_recebido: z.number().nullish().transform(v => v ?? 0),
  total_custo_vendas: z.number().nullish().transform(v => v ?? 0),
  lucro_mensal: z.number().nullish().transform(v => v ?? 0),
  margem_lucro: z.number().nullish().transform(v => v ?? 0),
});

export interface IPerformanceMonth {
  label: string;
  faturado: number;
  custo: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  despesas: number;
  lucro: number;
}

export interface IComparativoMesData {
  vendas: number;
  compras: number;
  estoque: number;
  despesas_veiculo: number;
  despesas_fixas: number;
  despesas_variaveis: number;
  lucro: number;
}

export interface IComparativoMensal {
  mes_atual: IComparativoMesData;
  mes_anterior: IComparativoMesData;
}

export interface IForecastMes {
  mes: string; // ex: 'Mar/2026'
  mesNum: number;
  ano: number;
  contas_pagar: number;
  contas_receber: number;
  lucro_projetado: number; // receber - pagar
}

export type CaixaTab = 'MES_ATUAL' | 'ANTERIORES';
