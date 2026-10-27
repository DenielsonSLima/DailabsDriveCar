import React, { useRef, useState } from 'react';
import type { ILoteCatalogos, ILoteDespesa, ILoteDespesaInput, ILoteUnidade } from '../lotes.types';
import type { ITitulo } from '../../financeiro/financeiro.types';
import { ErrorMessage, Field, fieldClass, LoteModal, dateLabel, money, today } from './LoteUi';

import { compatibleForms, Footer, Options, SettlementFields } from './LoteFormFields';
export { default as LoteVendaForm } from './LoteVendaForm';

export function LoteDespesaForm({ catalogos, unidades, defaults, onSave, onClose }: {
  catalogos: ILoteCatalogos;
  unidades: ILoteUnidade[];
  defaults?: ILoteDespesa;
  onSave: (data: ILoteDespesaInput & { motivo?: string }, requestId: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const requestId = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [descricao, setDescricao] = useState(defaults?.descricao || '');
  const [valor, setValor] = useState(defaults ? String(defaults.valor_total) : '');
  const [data, setData] = useState(defaults?.data_vencimento?.slice(0, 10) || today());
  const [categoria, setCategoria] = useState(defaults?.categoria_id || '');
  const [fornecedor, setFornecedor] = useState(defaults?.fornecedor_id || '');
  const [comprovante, setComprovante] = useState(defaults?.comprovante_url || '');
  const [unidade, setUnidade] = useState(defaults?.veiculo_id || '');
  const [pago, setPago] = useState(false);
  const [conta, setConta] = useState('');
  const [forma, setForma] = useState('');
  const [motivo, setMotivo] = useState('');
  const editing = !!defaults;
  const fornecedores = catalogos.parceiros.filter(item => item.tipo === 'FORNECEDOR' || item.tipo === 'AMBOS' || item.id === defaults?.fornecedor_id);

  return <LoteModal title={editing ? 'Corrigir despesa do lote' : 'Adicionar despesa ao lote'} busy={busy} onClose={onClose}>
    <form className="space-y-5" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setError(undefined);
      if (!descricao.trim()) { setError(new Error('Informe a descrição da despesa.')); return; }
      if (editing && motivo.trim().length < 5) { setError(new Error('Informe o motivo da correção com pelo menos 5 caracteres.')); return; }
      setBusy(true);
      try {
        await onSave({
          descricao: descricao.trim(), valor_total: Number(valor), data_vencimento: data,
          categoria_id: categoria, fornecedor_id: fornecedor || null, comprovante_url: comprovante || null,
          veiculo_id: unidade || null, pago_agora: !editing && pago,
          conta_bancaria_id: !editing && pago ? conta : null,
          forma_pagamento_id: !editing && pago ? forma : null,
          ...(editing ? { motivo: motivo.trim() } : {}),
        }, requestId.current);
        onClose();
      } catch (err) { setError(err); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="space-y-5">
        {editing && <p className="rounded-xl bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-800">A correção será registrada no histórico. Pagamentos existentes são tratados separadamente pelo financeiro.</p>}
        <Field label="Descrição"><input className={fieldClass} required maxLength={200} placeholder="Ex.: frete das motos ou serviço de mecânica" value={descricao} onChange={event => setDescricao(event.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Valor total (R$)"><input className={fieldClass} required inputMode="decimal" type="number" min="0.01" step="0.01" value={valor} onChange={event => setValor(event.target.value)} /></Field><Field label="Vencimento"><input className={fieldClass} required type="date" value={data} onChange={event => setData(event.target.value)} /></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Categoria"><select required className={fieldClass} value={categoria} onChange={event => setCategoria(event.target.value)}><Options items={catalogos.categorias} /></select></Field><Field label="Fornecedor (opcional)"><select className={fieldClass} value={fornecedor} onChange={event => setFornecedor(event.target.value)}><Options items={fornecedores} label="Sem fornecedor informado" /></select></Field></div>
        <Field label="Aplicar despesa" hint="Despesas compartilhadas são rateadas entre as unidades; uma despesa específica afeta apenas a moto selecionada."><select className={fieldClass} value={unidade} onChange={event => setUnidade(event.target.value)}><option value="">Todo o lote</option>{unidades.map(item => <option key={item.id} value={item.id}>Unidade {item.lote_ordem} · {item.placa || item.chassi || 'Sem identificação'}</option>)}</select></Field>
        <Field label="Link do comprovante (opcional)"><input className={fieldClass} type="url" placeholder="https://…" value={comprovante} onChange={event => setComprovante(event.target.value)} /></Field>
        {editing ? <Field label="Motivo da correção" hint="Descreva o que foi corrigido para manter a rastreabilidade."><textarea className={fieldClass} required minLength={5} maxLength={500} rows={3} value={motivo} onChange={event => setMotivo(event.target.value)} /></Field> : <>
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={pago} onChange={event => setPago(event.target.checked)} />Despesa paga agora</label>
          {pago && <SettlementFields operation="PAGAMENTO" catalogos={catalogos} conta={conta} forma={forma} setConta={setConta} setForma={setForma} />}
        </>}
      </fieldset>
      <ErrorMessage error={error} />
      <Footer busy={busy} onClose={onClose} label={editing ? 'Salvar correção' : pago ? 'Registrar despesa e pagamento' : 'Registrar despesa'} />
    </form>
  </LoteModal>;
}

export function LoteBaixaForm({ titulo, catalogos, pendente, contexto, onSave, onClose }: { titulo: ITitulo; catalogos: ILoteCatalogos; pendente: number; contexto?: string; onSave: (data: { tituloId: string; valor: number; contaId: string; formaId: string; data: string; requestId: string }) => Promise<unknown>; onClose: () => void }) {
  const requestId = useRef(crypto.randomUUID());
  const operation = titulo.tipo === 'PAGAR' ? 'PAGAMENTO' : 'RECEBIMENTO';
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>(); const [valor, setValor] = useState(String(pendente)); const [data, setData] = useState(today()); const [conta, setConta] = useState(''); const [forma, setForma] = useState(compatibleForms(catalogos, operation, true).some(item => item.id === titulo.forma_pagamento_id) ? titulo.forma_pagamento_id : '');
  return <LoteModal title={titulo.tipo === 'PAGAR' ? 'Pagar conta do lote' : 'Receber parcela'} busy={busy} onClose={onClose}><form className="space-y-5" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(undefined); try { await onSave({ tituloId: titulo.id, valor: Number(valor), contaId: conta, formaId: forma, data, requestId: requestId.current }); onClose(); } catch (err) { setError(err); } finally { setBusy(false); } }}><div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">{contexto && <p className="text-sm font-bold text-slate-900">{contexto}</p>}<p className="text-sm text-slate-600">{titulo.descricao}</p><p className="text-xs font-semibold text-slate-500">Parcela {titulo.parcela_numero || 1}/{titulo.parcela_total || 1} · Vencimento: {dateLabel(titulo.data_vencimento)}</p><p className="text-sm font-black text-slate-900">Em aberto: {money(pendente)}</p></div><fieldset disabled={busy} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Valor da baixa (R$)" hint="Você pode registrar um pagamento parcial."><input className={fieldClass} required type="number" step="0.01" min="0.01" max={pendente} value={valor} onChange={event => setValor(event.target.value)} /></Field><Field label="Data"><input className={fieldClass} required type="date" max={today()} value={data} onChange={event => setData(event.target.value)} /></Field></div><SettlementFields operation={operation} catalogos={catalogos} conta={conta} forma={forma || ''} setConta={setConta} setForma={setForma} /></fieldset><ErrorMessage error={error} /><Footer busy={busy} onClose={onClose} label="Confirmar baixa" /></form></LoteModal>;
}

export function LoteIdentificacaoForm({ unidade, onSave, onClose }: { unidade: ILoteUnidade; onSave: (data: { veiculoId: string; chassi: string; placa: string }) => Promise<unknown>; onClose: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState<unknown>();
  const [chassi, setChassi] = useState(unidade.chassi || ''); const [placa, setPlaca] = useState(unidade.placa || '');
  return <LoteModal title={`Identificar unidade #${String(unidade.lote_ordem).padStart(2, '0')}`} busy={busy} onClose={onClose}><form className="space-y-5" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(undefined); try { await onSave({ veiculoId: unidade.id!, chassi: chassi.trim().toUpperCase(), placa: placa.trim().toUpperCase() }); onClose(); } catch (err) { setError(err); } finally { setBusy(false); } }}><p className="text-sm leading-relaxed text-slate-500">Preencha os dados disponíveis para reconhecer esta moto. O código interno da unidade permanece vinculado ao lote e à venda.</p><fieldset disabled={busy} className="space-y-4"><Field label="Chassi (opcional)"><input className={`${fieldClass} uppercase`} autoComplete="off" maxLength={30} value={chassi} onChange={event => setChassi(event.target.value)} /></Field><Field label="Placa (opcional)"><input className={`${fieldClass} uppercase`} autoComplete="off" maxLength={10} value={placa} onChange={event => setPlaca(event.target.value)} /></Field></fieldset><ErrorMessage error={error} /><Footer busy={busy} onClose={onClose} label="Salvar identificação" /></form></LoteModal>;
}
