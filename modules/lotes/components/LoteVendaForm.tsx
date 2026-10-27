import React, { useMemo, useRef, useState } from 'react';
import type { ILoteCatalogos, ILoteUnidade, ILoteVendaInput } from '../lotes.types';
import { buildPaymentSchedule } from '../../pedidos-venda/utils/payment-schedule';
import { ErrorMessage, Field, fieldClass, LoteModal, dateLabel, money, today } from './LoteUi';
import { compatibleForms, Footer, Options, SettlementFields } from './LoteFormFields';

type Props = {
  catalogos: ILoteCatalogos;
  unidades: ILoteUnidade[];
  disponiveis?: number;
  onSave: (data: ILoteVendaInput, requestId: string) => Promise<unknown>;
  onClose: () => void;
};

const cents = (value: unknown) => Math.round(Number(value || 0) * 100);
const unitCode = (unit: ILoteUnidade) => `#${String(unit.lote_ordem).padStart(2, '0')}`;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function calcularPreviaVendaLote(unidades: ILoteUnidade[], precoUnitario: number) {
  const custo = unidades.reduce((total, unit) => total + cents(unit.is_consignado ? 0 : unit.valor_custo) + cents(unit.valor_custo_servicos), 0) / 100;
  const total = Math.round(unidades.length * precoUnitario * 100) / 100;
  const resultado = (cents(total) - cents(custo)) / 100;
  return { quantidade: unidades.length, custo, total, resultado, margem: total > 0 ? resultado / total * 100 : null };
}

export function buscarUnidadesVendaLote<T extends ILoteUnidade>(unidades: T[], busca: string) {
  const term = normalize(busca);
  return unidades.filter(unit => normalize(`${unitCode(unit)} #${unit.lote_ordem} ${unit.lote_ordem} ${unit.placa || ''} ${unit.chassi || ''}`).includes(term));
}

export default function LoteVendaForm({ catalogos, unidades, onSave, onClose }: Props) {
  const requestId = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState('');
  const [unitario, setUnitario] = useState('');
  const [data, setData] = useState(today());
  const [entrada, setEntrada] = useState('0');
  const [vencimento, setVencimento] = useState(today());
  const [parcelas, setParcelas] = useState(1);
  const [intervalo, setIntervalo] = useState(30);
  const [conta, setConta] = useState('');
  const [formaSinal, setFormaSinal] = useState('');
  const [formaSaldo, setFormaSaldo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const disponiveis = unidades.filter((unit): unit is ILoteUnidade & { id: string } => unit.status === 'DISPONIVEL' && typeof unit.id === 'string');
  const escolhidas = disponiveis.filter(unit => selecionadas.includes(unit.id));
  const visiveis = buscarUnidadesVendaLote(disponiveis, busca);
  const previa = calcularPreviaVendaLote(escolhidas, Number(unitario));
  const selecaoIndisponivel = escolhidas.length !== selecionadas.length;
  const saldo = (cents(previa.total) - cents(entrada)) / 100;
  const schedule = useMemo(() => {
    if (!(saldo > 0) || !vencimento) return [];
    try { return buildPaymentSchedule(saldo, vencimento, { qtd_parcelas: parcelas, dias_primeira_parcela: 0, dias_entre_parcelas: intervalo }); }
    catch { return []; }
  }, [saldo, vencimento, parcelas, intervalo]);
  const toggleUnit = (id: string) => setSelecionadas(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  return <LoteModal title="Registrar venda do lote" busy={busy} onClose={onClose}>
    <form className="space-y-5" onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      setError(undefined);
      if (!escolhidas.length) { setError(new Error('Selecione as unidades físicas que serão entregues ao cliente.')); return; }
      if (selecaoIndisponivel) { setError(new Error('Uma unidade selecionada não está mais disponível. Revise a seleção antes de confirmar.')); return; }
      if (!(previa.total > 0) || !Number.isFinite(previa.total)) { setError(new Error('Informe um preço por unidade válido.')); return; }
      if (saldo < 0) { setError(new Error('A entrada não pode superar o valor da venda.')); return; }
      if (saldo > 0 && !schedule.length) { setError(new Error('Revise o valor e as parcelas do saldo a receber.')); return; }
      if (schedule.some(parcela => parcela.data_vencimento < data)) { setError(new Error('O primeiro vencimento não pode anteceder a data da venda.')); return; }
      setBusy(true);
      try {
        await onSave({
          cliente_id: cliente,
          veiculo_ids: escolhidas.map(unit => unit.id),
          quantidade: escolhidas.length,
          valor_total: previa.total,
          data_venda: data,
          observacoes: observacoes.trim(),
          pagamentos: [
            ...(Number(entrada) > 0 ? [{ valor: Number(entrada), data_recebimento: data, conta_bancaria_id: conta, forma_pagamento_id: formaSinal }] : []),
            ...schedule.map(parcela => ({ valor: parcela.valor, data_recebimento: parcela.data_vencimento, conta_bancaria_id: null, forma_pagamento_id: formaSaldo })),
          ],
        }, requestId.current);
        onClose();
      } catch (err) { setError(err); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="space-y-5">
        <Field label="Cliente"><select className={fieldClass} required value={cliente} onChange={event => setCliente(event.target.value)}><Options items={catalogos.parceiros.filter(item => item.tipo === 'CLIENTE' || item.tipo === 'AMBOS')} /></select></Field>
        <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-900">Unidades desta venda</legend>
          <p className="text-xs leading-relaxed text-slate-500">Marque as motos que serão entregues. A quantidade será calculada pela seleção.</p>
          <Field label="Buscar unidade"><input className={fieldClass} type="search" placeholder="Código, placa ou chassi" value={busca} onChange={event => setBusca(event.target.value)} /></Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-indigo-600" role="status">{escolhidas.length} selecionadas · {disponiveis.length} disponíveis</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="min-h-10 text-xs font-bold text-indigo-600 hover:underline disabled:opacity-50" disabled={!visiveis.length} onClick={() => setSelecionadas(current => [...new Set([...current, ...visiveis.map(unit => unit.id)])])}>Selecionar {visiveis.length} resultados</button>
              <button type="button" className="min-h-10 text-xs font-bold text-slate-500 hover:underline disabled:opacity-50" disabled={!selecionadas.length} onClick={() => setSelecionadas([])}>Limpar seleção</button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
            {!visiveis.length && <p className="p-4 text-sm text-slate-500">Nenhuma unidade disponível corresponde à busca.</p>}
            {visiveis.map(unit => <label key={unit.id} className={`flex cursor-pointer items-start gap-3 p-3 transition-colors ${selecionadas.includes(unit.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
              <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-indigo-600" checked={selecionadas.includes(unit.id)} onChange={() => toggleUnit(unit.id)} />
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">Unidade {unitCode(unit)}</span><span className="mt-1 block break-all text-xs text-slate-500">Placa: {unit.placa || 'Não informada'} · Chassi: {unit.chassi || 'Não informado'}</span><span className="mt-1 block text-xs font-semibold text-slate-600">Custo atualizado: {money(calcularPreviaVendaLote([unit], 0).custo)}</span></span>
            </label>)}
          </div>
          {selecionadas.length > 0 && <p className="break-words text-xs text-slate-600">Selecionadas: {escolhidas.map(unitCode).join(', ') || 'Nenhuma unidade ainda disponível'}</p>}
          {selecaoIndisponivel && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Uma unidade selecionada ficou indisponível. Limpe a seleção e marque novamente as unidades desejadas.</p>}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Preço por unidade (R$)"><input className={fieldClass} required type="number" step="0.01" min="0.01" value={unitario} onChange={event => setUnitario(event.target.value)} /></Field><Field label="Data da venda"><input className={fieldClass} required type="date" max={today()} value={data} onChange={event => setData(event.target.value)} /></Field></div>
        <section aria-label="Resultado previsto da venda" className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-500">Total da venda · {escolhidas.length} unidades</dt><dd className="mt-1 text-xl font-black tabular-nums text-slate-900">{money(previa.total)}</dd></div>
            <div><dt className="text-xs text-slate-500">Custo atualizado das selecionadas</dt><dd className="mt-1 text-xl font-black tabular-nums text-slate-900">{money(previa.custo)}</dd></div>
            <div><dt className="text-xs text-slate-500">Resultado esperado</dt><dd className={`mt-1 text-lg font-black tabular-nums ${previa.resultado < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{escolhidas.length && previa.total > 0 ? money(previa.resultado) : '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">Margem sobre a venda</dt><dd className="mt-1 text-lg font-black tabular-nums text-slate-900">{previa.margem === null ? '—' : `${previa.margem.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">Resultado = venda menos custo atual das unidades escolhidas. Novas despesas podem alterar esse resultado.</p>
          {escolhidas.length > 0 && previa.total > 0 && previa.resultado < 0 && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Preço abaixo do custo: prejuízo estimado de {money(-previa.resultado)}. Você pode confirmar a venda se esse valor foi negociado conscientemente.</p>}
        </section>
        <Field label="Entrada recebida agora (R$)" hint="Informe zero se o cliente ainda não pagou."><input className={fieldClass} required type="number" step="0.01" min="0" max={previa.total || undefined} value={entrada} onChange={event => setEntrada(event.target.value)} /></Field>
        {Number(entrada) > 0 && <SettlementFields operation="RECEBIMENTO" formaLabel="Forma do sinal recebido" catalogos={catalogos} conta={conta} forma={formaSinal} setConta={setConta} setForma={setFormaSinal} />}
        {saldo > 0 && <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <p className="text-sm font-bold text-indigo-900">Saldo a receber: {money(saldo)}</p>
          <Field label="Forma do saldo a receber"><select required className={fieldClass} value={formaSaldo} onChange={event => setFormaSaldo(event.target.value)}><Options items={compatibleForms(catalogos, 'RECEBIMENTO')} /></select></Field>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Primeiro vencimento"><input className={fieldClass} required type="date" min={data} value={vencimento} onChange={event => setVencimento(event.target.value)} /></Field><Field label="Parcelas"><input className={fieldClass} required type="number" min="1" max="120" step="1" value={parcelas} onChange={event => setParcelas(Number(event.target.value))} /></Field><Field label="Intervalo (dias)"><input className={fieldClass} required type="number" min="1" step="1" value={intervalo} onChange={event => setIntervalo(Number(event.target.value))} /></Field></div>
          {schedule.length ? <details className="rounded-xl border border-indigo-100 bg-white"><summary className="cursor-pointer p-3 text-xs font-bold text-indigo-700">{schedule.length} parcela(s), a partir de {money(schedule[0].valor)} · Ver vencimentos</summary><ol className="max-h-48 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">{schedule.map(parcela => <li key={parcela.numero} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-xs text-slate-600"><span>Parcela {parcela.numero} · {dateLabel(parcela.data_vencimento)}</span><strong className="tabular-nums text-slate-900">{money(parcela.valor)}</strong></li>)}</ol></details> : <p className="text-xs text-rose-600">Revise os dados do parcelamento.</p>}
          <p className="text-xs text-slate-600">O recebimento do saldo será confirmado na baixa financeira.</p>
        </div>}
        <Field label="Observações (opcional)"><textarea className={fieldClass} rows={2} value={observacoes} onChange={event => setObservacoes(event.target.value)} /></Field>
      </fieldset>
      <ErrorMessage error={error} />
      <Footer busy={busy} disabled={!escolhidas.length || selecaoIndisponivel} onClose={onClose} label="Confirmar venda" />
    </form>
  </LoteModal>;
}
