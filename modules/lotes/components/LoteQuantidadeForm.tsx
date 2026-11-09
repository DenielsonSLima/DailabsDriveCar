import React, { useRef, useState } from 'react';
import type { ILoteDetalhes, ILoteQuantidadeInput } from '../lotes.types';
import { atualizarDescricaoQuantidade, bloqueioAjusteQuantidade, calcularRateioAquisicao } from '../lotes.quantidade';
import { ErrorMessage, Field, fieldClass, LoteModal, money, primaryClass, secondaryClass } from './LoteUi';

export default function LoteQuantidadeForm({ detalhes, onSave, onClose }: {
  detalhes: ILoteDetalhes;
  onSave: (dados: ILoteQuantidadeInput, requestId: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const [original] = useState(detalhes.lote);
  const [quantidade, setQuantidade] = useState(String(original.quantidade_inicial));
  const [descricao, setDescricao] = useState(original.descricao);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const submitting = useRef(false);
  const ultimaQuantidade = useRef(original.quantidade_inicial);
  const intent = useRef<{ payload: string; id: string } | null>(null);
  const numero = Number(quantidade);
  const rateio = calcularRateioAquisicao(original.custo_aquisicao, numero);
  const bloqueio = bloqueioAjusteQuantidade(detalhes);
  const alterado = numero !== original.quantidade_inicial || descricao.trim() !== original.descricao;
  const despesas = detalhes.despesas.reduce((sum, item) => sum + Math.round(Number(item.valor_total) * 100), 0) / 100;
  const changeQuantity = (value: string) => {
    const next = Number(value);
    if (Number.isInteger(next) && next >= 2 && next <= 10000) {
      const anterior = ultimaQuantidade.current;
      setDescricao(current => atualizarDescricaoQuantidade(current, anterior, next));
      ultimaQuantidade.current = next;
    }
    setQuantidade(value);
  };
  return <LoteModal title="Editar quantidade do lote" busy={busy} onClose={onClose}>
    <form className="space-y-5" onSubmit={async event => {
      event.preventDefault();
      if (submitting.current) return;
      setError(undefined);
      if (bloqueio || !rateio || !descricao.trim() || !alterado) {
        setError(new Error(bloqueio || 'Informe de 2 a 10.000 unidades, uma descrição e uma alteração.'));
        return;
      }
      const dados: ILoteQuantidadeInput = { quantidade: numero, descricao: descricao.trim(), quantidade_atual: original.quantidade_inicial };
      const payload = JSON.stringify(dados);
      if (intent.current?.payload !== payload) intent.current = { payload, id: crypto.randomUUID() };
      submitting.current = true;
      setBusy(true);
      try { await onSave(dados, intent.current.id); onClose(); }
      catch (err) { setError(err); }
      finally { submitting.current = false; setBusy(false); }
    }}>
      <p className="text-sm leading-relaxed text-slate-600">Corrija a quantidade sem alterar o total da compra ou os pagamentos. As unidades serão rateadas novamente em centavos.</p>
      <fieldset disabled={busy || !!bloqueio} className="space-y-4">
        <Field label="Quantidade de unidades" hint={`Quantidade atual: ${original.quantidade_inicial}. Informe de 2 a 10.000 unidades.`}>
          <input className={fieldClass} required type="number" inputMode="numeric" min="2" max="10000" step="1" value={quantidade} onChange={event => changeQuantity(event.target.value)} />
        </Field>
        <Field label="Descrição do lote" hint="Confira se a descrição corresponde à quantidade corrigida.">
          <input className={fieldClass} required maxLength={200} value={descricao} onChange={event => setDescricao(event.target.value)} />
        </Field>
      </fieldset>
      {rateio && <div aria-live="polite" className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-slate-700">
        <p>Total de aquisição preservado: <strong>{money(rateio.total)}</strong></p>
        <p>Quantidade: <strong>{original.quantidade_inicial} → {numero}</strong></p>
        <p>Custo de aquisição por unidade: <strong>{money(rateio.valorBase)}{rateio.quantidadeExtra > 0 && ` a ${money(rateio.valorExtra)}`}</strong></p>
        {rateio.quantidadeExtra > 0 && <p className="text-xs">{rateio.quantidadeBase} unidades de {money(rateio.valorBase)} e {rateio.quantidadeExtra} unidades de {money(rateio.valorExtra)}. Total exato, sem perda de centavos.</p>}
        <p>Despesas do lote, separadas da aquisição: <strong>{money(despesas)}</strong>.</p>
        <p className="text-xs">Despesas gerais serão rateadas novamente. Despesas específicas continuam vinculadas às respectivas unidades.</p>
      </div>}
      <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Ao reduzir, as unidades finais serão arquivadas. Unidades com identificação, venda, despesa específica ou outros vínculos não podem ser retiradas. O banco verifica essas condições antes de salvar. Um aumento restaura ou cria unidades.</p>
      <ErrorMessage error={bloqueio || error} />
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
        <button type="button" className={secondaryClass} disabled={busy} onClick={onClose}>Voltar</button>
        <button type="submit" className={primaryClass} disabled={busy || !!bloqueio || !rateio || !descricao.trim() || !alterado}>{busy ? 'Salvando…' : 'Salvar quantidade e rateio'}</button>
      </div>
    </form>
  </LoteModal>;
}
