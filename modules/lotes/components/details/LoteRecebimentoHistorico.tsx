import React from 'react';
import type { ITituloReceber } from '../../../financeiro/submodules/contas-receber/contas-receber.types';
import { dateLabel, money } from '../LoteUi';

/** Read-only projection of the existing title history. No payment/edit actions. */
export default function LoteRecebimentoHistorico({ titulo }: { titulo: ITituloReceber }) {
  const transacoes = titulo.transacoes || [];
  return <section className="dc-panel space-y-3" aria-label="Histórico de recebimentos">
    <h3 className="dc-section-title">Histórico de recebimentos</h3>
    {transacoes.length === 0 ? <p className="text-sm text-slate-600">Nenhum recebimento registrado.</p> : <ul className="divide-y divide-slate-100">
      {transacoes.map(t => <li key={t.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-slate-900">{t.tipo_transacao === 'DESCONTO_TITULO' ? 'Desconto' : t.tipo_transacao === 'ACRESCIMO_TITULO' ? 'Acréscimo (juros)' : 'Recebimento'}</span>
          <span className="font-semibold tabular-nums whitespace-nowrap text-slate-900">{t.tipo_transacao === 'DESCONTO_TITULO' ? '-' : ''}{money(t.valor)}</span>
        </div>
        <p className="text-xs text-slate-600">{dateLabel(t.data_pagamento?.slice(0, 10))}{['DESCONTO_TITULO', 'ACRESCIMO_TITULO'].includes(t.tipo_transacao) ? ' · Ajuste do título' : ''}</p>
        {t.conta && <p className="text-xs text-slate-600 break-words">{t.conta.banco_nome || t.conta.titular} · Ag: {t.conta.agencia || '—'} · CC: {t.conta.conta || '—'}</p>}
      </li>)}
    </ul>}
  </section>;
}
