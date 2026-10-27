import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
export const today = () => new Date().toLocaleDateString('en-CA');
export const dateLabel = (value?: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : '—';
export const fieldClass = 'w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100';
export const primaryClass = 'inline-flex min-h-11 items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm hover:bg-indigo-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryClass = 'inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm hover:bg-slate-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50';

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block space-y-1.5 text-sm font-semibold text-slate-700"><span>{label}</span>{children}{hint && <span className="block text-xs font-normal leading-relaxed text-slate-500">{hint}</span>}</label>;
}

export function ErrorMessage({ error }: { error?: unknown }) {
  if (!error) return null;
  return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-relaxed text-rose-700">{error instanceof Error ? error.message : String(error)}</p>;
}

export function LoteModal({ title, children, onClose, busy = false }: { title: string; children: React.ReactNode; onClose: () => void; busy?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || []);
    (focusable().find(el => el.tagName === 'INPUT') || focusable()[0] || dialogRef.current)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); closeRef.current(); }
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0]; const last = elements[elements.length - 1];
        if (!first) { event.preventDefault(); dialogRef.current?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7"><h2 id={titleId} className="text-xl font-black tracking-tight text-slate-900">{title}</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Fechar janela" className="h-10 w-10 shrink-0 rounded-xl text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50">×</button></div>
      <div className="p-5 sm:p-7">{children}</div>
    </div>
  </div>, document.body);
}
