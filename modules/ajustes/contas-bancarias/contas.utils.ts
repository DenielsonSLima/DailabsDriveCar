import type { IContaBancaria } from './contas.types';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Mesmo rótulo nos lançamentos e nas baixas, inclusive no controle de lotes. */
export function formatContaBancaria(conta: Pick<IContaBancaria, 'banco_nome' | 'titular' | 'saldo_atual'>): string {
  return `${conta.banco_nome || 'Conta bancária'} - ${conta.titular || 'Titular não informado'} | Saldo: ${moeda.format(conta.saldo_atual ?? 0)}`;
}
