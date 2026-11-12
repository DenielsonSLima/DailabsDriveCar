import { useSyncExternalStore } from 'react';
import type { ITitulo } from '../../financeiro.types';

// UI coordination only. RPC idempotency and money calculations remain in the service/database.
// One title cannot start another intent while its current request is still pending,
// even after changing routes or remounting the payment form.
interface PaymentState { pending: boolean; refreshSnapshot?: ITitulo }
const idle: PaymentState = { pending: false };
const states = new Map<string, PaymentState>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
const balanceVersion = (titulo: ITitulo) => JSON.stringify([titulo.status, ...[titulo.valor_total, titulo.valor_pago, titulo.valor_acrescimo, titulo.valor_desconto, titulo.valor_pendente, titulo.valor_liquidado].map(value => Number(value || 0))]);
const read = (id?: string | null) => (id && states.get(id)) || idle;
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export const useTituloPaymentState = (id?: string | null) => useSyncExternalStore(subscribe, () => read(id), () => idle);
export const beginTituloPayment = (id: string): boolean => {
  const current = read(id);
  if (current.pending || current.refreshSnapshot) return false;
  states.set(id, { pending: true }); notify(); return true;
};
export const finishTituloPayment = (id: string) => {
  const current = read(id);
  if (current.refreshSnapshot) states.set(id, { ...current, pending: false });
  else states.delete(id);
  notify();
};
export const awaitTituloRefresh = (titulo: ITitulo) => {
  states.set(titulo.id, { ...read(titulo.id), refreshSnapshot: titulo }); notify();
};
export const acknowledgeTituloRefresh = (titulo: ITitulo) => {
  const current = read(titulo.id);
  if (!current.refreshSnapshot || balanceVersion(current.refreshSnapshot) === balanceVersion(titulo)) return;
  if (current.pending) states.set(titulo.id, { pending: true }); else states.delete(titulo.id);
  notify();
};
