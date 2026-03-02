
export type TipoConta = 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CAIXA_FISICO';

export interface IContaBancaria {
  id: string;
  user_id?: string;
  banco_nome: string;   // Instituição
  banco_codigo?: string;
  titular: string;      // Titular da Conta
  agencia: string;
  conta: string;

  tipo: TipoConta;      // Mantido para ícones/lógica interna
  cor_cartao: string;

  saldo_inicial: number;
  data_saldo_inicial?: string;
  saldo_atual: number;

  permite_negativo: boolean; // Se falso, bloqueia saídas que deixem o saldo < 0

  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}
