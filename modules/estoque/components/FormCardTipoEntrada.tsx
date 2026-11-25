import React from 'react';
import { ENTRADA_LOTE_DESCRICAO_MAX, ENTRADA_LOTE_MAX } from '../../pedidos-compra/pedidos-compra.types';
import { isQuantidadeLoteValida } from '../../pedidos-compra/entrada-lote';

interface Props {
  entradaEmLote: boolean;
  lotePermitido: boolean;
  consignacao: boolean;
  quantidade: string;
  descricao: string;
  custoTotal: number;
  disabled: boolean;
  onTipoChange: (tipo: 'individual' | 'lote') => void;
  onQuantidadeChange: (valor: string) => void;
  onDescricaoChange: (valor: string) => void;
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FormCardTipoEntrada({
  entradaEmLote, lotePermitido, consignacao, quantidade, descricao, custoTotal, disabled,
  onTipoChange, onQuantidadeChange, onDescricaoChange,
}: Props) {
  const total = Number(quantidade);
  const valido = isQuantidadeLoteValida(total);
  const input = 'dc-input w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
  return (
    <section className="dc-panel mx-4">
      <fieldset disabled={disabled} className="min-w-0 space-y-3">
        <legend className="dc-section-title mb-3 text-slate-900">Tipo de entrada</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['individual', 'lote'] as const).map(tipo => {
            const isLote = tipo === 'lote';
            const selecionado = entradaEmLote === isLote;
            return (
              <label key={tipo} className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${selecionado ? 'border-indigo-400 bg-indigo-50 text-indigo-900' : 'border-slate-200 text-slate-700'} ${isLote && !lotePermitido ? 'opacity-60' : 'cursor-pointer'}`}>
                <input type="radio" name="tipo-entrada-ficha" value={tipo} checked={selecionado}
                  disabled={isLote && !lotePermitido} onChange={() => onTipoChange(tipo)} className="accent-indigo-600" />
                {isLote ? 'Lote' : 'Individual'}
              </label>
            );
          })}
        </div>
        {!lotePermitido && <p className="text-xs text-slate-600">
          {consignacao ? 'Consignação é cadastrada como entrada individual.' : 'Para cadastrar um lote, use uma entrada com uma única ficha.'}
        </p>}
        {entradaEmLote && <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <label className="block space-y-1 text-sm font-semibold text-slate-700">
              <span>Quantidade de unidades</span>
              <input type="number" inputMode="numeric" min={2} max={ENTRADA_LOTE_MAX} step={1} required
                aria-invalid={quantidade !== '' && !valido} aria-describedby="entrada-lote-ajuda"
                className={input} placeholder="Ex.: 12" value={quantidade} onChange={e => onQuantidadeChange(e.target.value)} />
            </label>
            <label className="block space-y-1 text-sm font-semibold text-slate-700">
              <span>Descrição do lote</span>
              <input type="text" required maxLength={ENTRADA_LOTE_DESCRICAO_MAX} className={input}
                placeholder="Ex.: Motos elétricas · Novembro" value={descricao} onChange={e => onDescricaoChange(e.target.value)} />
            </label>
          </div>
          <p id="entrada-lote-ajuda" className={`text-xs ${quantidade !== '' && !valido ? 'font-semibold text-rose-700' : 'text-indigo-900'}`}>
            Cadastre uma ficha para o lote e informe o custo total abaixo. Quantidade: 2 a 1.000 unidades.
            {valido && custoTotal > 0 && ` Custo médio: ${currency.format(custoTotal / total)} por unidade.`}
          </p>
        </div>}
      </fieldset>
    </section>
  );
}
