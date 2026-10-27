import React from 'react';
import type { ILoteCatalogos } from '../lotes.types';
import { Field, fieldClass, primaryClass, secondaryClass } from './LoteUi';

export function Options({ items, label = 'Selecione' }: { items: Array<{ id: string; nome?: string; banco_nome?: string; conta?: string }>; label?: string }) {
  return <><option value="">{label}</option>{items.map(item => <option key={item.id} value={item.id}>{item.nome || `${item.banco_nome} · ${item.conta}`}</option>)}</>;
}

export function compatibleForms(catalogos: ILoteCatalogos, operation: 'PAGAMENTO' | 'RECEBIMENTO', immediate = false) {
  const futureDestination = operation === 'PAGAMENTO' ? 'CONTAS_PAGAR' : 'CONTAS_RECEBER';
  return catalogos.formas.filter(item => (item.tipo_movimentacao === operation || item.tipo_movimentacao === 'AMBOS') && (item.destino_lancamento === 'CAIXA' || (!immediate && item.destino_lancamento === futureDestination)));
}

export function SettlementFields({ catalogos, conta, forma, setConta, setForma, operation, formaLabel }: {
  catalogos: ILoteCatalogos;
  conta: string;
  forma: string;
  setConta: (value: string) => void;
  setForma: (value: string) => void;
  operation: 'PAGAMENTO' | 'RECEBIMENTO';
  formaLabel?: string;
}) {
  return <div className="grid gap-4 sm:grid-cols-2"><Field label="Conta bancária"><select required className={fieldClass} value={conta} onChange={event => setConta(event.target.value)}><Options items={catalogos.contas} /></select></Field><Field label={formaLabel || (operation === 'PAGAMENTO' ? 'Forma de pagamento' : 'Forma de recebimento')}><select required className={fieldClass} value={forma} onChange={event => setForma(event.target.value)}><Options items={compatibleForms(catalogos, operation, true)} /></select></Field></div>;
}

export function Footer({ busy, onClose, label, disabled = false }: { busy: boolean; onClose: () => void; label: string; disabled?: boolean }) {
  return <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" disabled={busy} onClick={onClose} className={secondaryClass}>Voltar</button><button disabled={busy || disabled} type="submit" className={primaryClass}>{busy ? 'Salvando…' : label}</button></div>;
}
