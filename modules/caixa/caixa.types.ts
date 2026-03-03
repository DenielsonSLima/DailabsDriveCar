import { z } from 'zod';
import { IContaBancaria } from '../ajustes/contas-bancarias/contas.types';
import { ITransacao } from '../financeiro/financeiro.types';

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
  lucro_periodo: number; // Lucro nas vendas do mês
  veiculos: {
    id: string;
    montadora: string;
    modelo: string;
    versao: string;
    placa: string;
    valor: number;
    imagem?: string;
  }[];
  patrimonio_pessoal: IPatrimonioItem[];
}

export interface ICaixaDashboardData {
  // KPIs Principais
  patrimonio_liquido: number;
  saldo_disponivel: number;
  total_ativos_estoque: number;
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
  total_vendas: number;
  lucro_mensal: number;
}

export const CaixaDashboardSchema = z.object({
  patrimonio_liquido: z.number().nullable().transform(v => v ?? 0),
  saldo_disponivel: z.number().nullable().transform(v => v ?? 0),
  total_ativos_estoque: z.number().nullable().transform(v => v ?? 0),
  total_recebiveis: z.number().nullable().transform(v => v ?? 0),
  total_passivo_circulante: z.number().nullable().transform(v => v ?? 0),
  total_despesas_fixas: z.number().nullable().transform(v => v ?? 0),
  total_despesas_variaveis: z.number().nullable().transform(v => v ?? 0),
  total_entradas: z.number().nullish().transform(v => v ?? 0),
  total_saidas: z.number().nullish().transform(v => v ?? 0),
  total_compras: z.number().nullish().transform(v => v ?? 0),
  total_vendas: z.number().nullish().transform(v => v ?? 0),
  lucro_mensal: z.number().nullable().transform(v => v ?? 0),
});

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
