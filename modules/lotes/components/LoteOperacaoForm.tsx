import React, { useRef, useState } from 'react';
import { ErrorMessage, Field, fieldClass, LoteModal, primaryClass, secondaryClass, today } from './LoteUi';

interface Props {
  title: string;
  description: React.ReactNode;
  showDate?: boolean;
  minimumDate?: string;
  onClose: () => void;
  onSave: (motivo: string, data: string, requestId: string) => Promise<unknown>;
}

export default function LoteOperacaoForm({ title, description, showDate = false, minimumDate, onClose, onSave }: Props) {
  const requestId = useRef(crypto.randomUUID());
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  return (
    <LoteModal title={title} busy={busy} onClose={onClose}>
      <form className="space-y-5" onSubmit={async event => {
        event.preventDefault();
        if (motivo.trim().length < 5) { setError(new Error('Descreva o motivo com pelo menos 5 caracteres.')); return; }
        setBusy(true); setError(undefined);
        try { await onSave(motivo.trim(), data, requestId.current); onClose(); }
        catch (err) { setError(err); }
        finally { setBusy(false); }
      }}>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">{description}</div>
        <fieldset disabled={busy} className="space-y-4">
          <Field label="Motivo" hint="O motivo será registrado no histórico do lote.">
            <textarea required minLength={5} maxLength={500} rows={3} className={fieldClass} value={motivo} onChange={event => setMotivo(event.target.value)} />
          </Field>
          {showDate && <Field label="Data da operação"><input required type="date" min={minimumDate} max={today()} value={data} className={fieldClass} onChange={event => setData(event.target.value)} /></Field>}
        </fieldset>
        <ErrorMessage error={error} />
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" disabled={busy} onClick={onClose} className={secondaryClass}>Voltar</button>
          <button type="submit" disabled={busy} className={primaryClass}>{busy ? 'Processando…' : title}</button>
        </div>
      </form>
    </LoteModal>
  );
}
