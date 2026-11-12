import { acknowledgeTituloRefresh, beginTituloPayment, finishTituloPayment, useTituloPaymentState } from './tituloPaymentState';
import { formatContaBancaria } from '../../../ajustes/contas-bancarias/contas.utils';
import React, { useState, useEffect, useRef, useId } from 'react';
import { ITitulo } from '../../financeiro.types';
import { FinanceiroService } from '../../financeiro.service';
import { ContasBancariasService } from '../../../ajustes/contas-bancarias/contas.service';
import { FormasPagamentoService } from '../../../cadastros/formas-pagamento/formas-pagamento.service';
import { todayLocal } from '../../../../utils/date';
import { maskCurrency, parseCurrencyToNumber } from '../../../../utils/currency';

interface Props {
  titulo: ITitulo;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  presentation?: 'modal' | 'inline';
}

const isPaymentBlocked = (state: { pending: boolean; refreshSnapshot?: ITitulo }) => state.pending || !!state.refreshSnapshot;

const ModalBaixa: React.FC<Props> = ({ titulo, onClose, onSuccess, presentation = 'modal' }) => {
  const inline = presentation === 'inline';
  const formId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (inline) headingRef.current?.focus(); }, [inline]);
  const savingRef = useRef(false);
  const paymentState = useTituloPaymentState(titulo.id);
  const paymentBlocked = isPaymentBlocked(paymentState);
  useEffect(() => { acknowledgeTituloRefresh(titulo); }, [titulo, paymentState.refreshSnapshot]);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [contas, setContas] = useState<any[]>([]);
  const [formas, setFormas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const saldoDevedorOriginal = (titulo as any).valor_pendente ?? (titulo.valor_total + (titulo.valor_acrescimo || 0) - titulo.valor_pago - (titulo.valor_desconto || 0));

  // Form State
  const [valorDesconto, setValorDesconto] = useState(0);
  const [valorAcrescimo, setValorAcrescimo] = useState(0);
  const [valorPago, setValorPago] = useState(saldoDevedorOriginal);
  const [contaId, setContaId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [dataPagamento, setDataPagamento] = useState(() => inline ? todayLocal() : new Date().toISOString().split('T')[0]);

  // Raw states for masked inputs
  const [descontoRaw, setDescontoRaw] = useState('0,00');
  const [acrescimoRaw, setAcrescimoRaw] = useState('0,00');
  const [pagoRaw, setPagoRaw] = useState(maskCurrency(saldoDevedorOriginal));

  // Update valorPago automatically when acréscimo or desconto changes
  useEffect(() => {
    let newValor = saldoDevedorOriginal + valorAcrescimo - valorDesconto;
    if (newValor < 0) newValor = 0;
    setValorPago(newValor);
    setPagoRaw(maskCurrency(newValor));
  }, [valorDesconto, valorAcrescimo, saldoDevedorOriginal]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true); setLoadError(false);
      try {
      const [cData, fData] = await Promise.all([
        ContasBancariasService.getAll(),
        FormasPagamentoService.getAll()
      ]);
      
      if (!active) return;
      const activeContas = cData.filter(c => c.ativo);
      setContas(activeContas);
      if (activeContas.length === 1) {
        setContaId(activeContas[0].id);
      }

      // Filtrar apenas formas de movimento imediato (CAIXA) e que batam com o tipo do título
      const filteredFormas = fData.filter(f => {
        if (!f.ativo) return false;

        // Só queremos formas que representem movimento de caixa/banco imediato no momento da baixa
        // (A Prazo e Consignação não devem aparecer aqui pois são condições de origem, não de liquidação)
        if (f.destino_lancamento !== 'CAIXA') return false;

        if (titulo.tipo === 'PAGAR') {
          return f.tipo_movimentacao === 'PAGAMENTO' || f.tipo_movimentacao === 'AMBOS';
        }
        return f.tipo_movimentacao === 'RECEBIMENTO' || f.tipo_movimentacao === 'AMBOS';
      });

      setFormas(filteredFormas);
      } catch { if (active) setLoadError(true); }
      finally { if (active) setLoading(false); }
    }
    void loadData();
    return () => { active = false; };
  }, [titulo.tipo, loadAttempt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current || paymentBlocked || loading || loadError) return;
    setFormError('');
    if (inline && (![valorPago, valorDesconto, valorAcrescimo].every(v => Number.isFinite(v) && v >= 0) || valorDesconto > saldoDevedorOriginal + valorAcrescimo || Math.round(valorPago * 100) > Math.round((saldoDevedorOriginal + valorAcrescimo - valorDesconto) * 100))) {
      setFormError('Confira os valores: a baixa e o desconto não podem exceder o saldo ajustado.'); return;
    }
    if ((valorPago > 0 && !contaId) || (valorPago > 0 && !formaId) || (valorPago === 0 && valorDesconto === 0)) {
      alert("Preencha todos os campos corretamente. Se o valor pago for maior que zero, é necessário informar conta e forma de movimentação.");
      return;
    }

    if (!beginTituloPayment(titulo.id)) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      // Passando valores de desconto e acrescimo pro backend
      // Se valorPago for 0 (ex: 100% de desconto), enviamos a data com contaId/formaId em branco pra RPC validar internamente
      await FinanceiroService.baixarTitulo(
        titulo,
        valorPago,
        contaId || '00000000-0000-0000-0000-000000000000',
        formaId || '00000000-0000-0000-0000-000000000000',
        valorDesconto,
        valorAcrescimo,
        dataPagamento
      );
      // O recálculo agora é 100% automático via TRIGGER no Postgres (fn_sync_titulo_totals)
      // Não é mais necessário chamar recalcularTitulo no Frontend. 🏛️🛡️
      await onSuccess();
    } catch (e: any) {
      if (inline) setFormError("Erro ao processar baixa: " + e.message);
      else alert("Erro ao processar baixa: " + e.message);
    } finally {
      finishTituloPayment(titulo.id);
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div data-drivecar-ui className={inline ? "min-w-0" : "fixed !m-0 inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"}>
      <div className={inline ? "dc-panel dc-panel-frame w-full min-w-0 overflow-hidden" : "dc-modal bg-white w-full max-w-md rounded-xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]"}>
        <div className={`dc-modal-header p-4 text-slate-900 shrink-0 ${titulo.tipo === 'PAGAR' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          <p className="text-xs font-medium normal-case tracking-normal opacity-80">Confirmar Liquidação</p>
          <h3 ref={headingRef} tabIndex={inline ? -1 : undefined} className="dc-modal-title text-xl font-semibold normal-case tracking-tight break-words mt-1">{titulo.descricao}</h3>
          <div className="mt-4 flex flex-wrap gap-3 justify-between items-end">
            <div>
              <p className="text-xs font-medium normal-case opacity-90">Saldo Devedor Original</p>
              <p className="text-lg font-semibold">{formatCurrency(saldoDevedorOriginal)}</p>
            </div>
            <p className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-lg">PARCELA {titulo.parcela_numero}/{titulo.parcela_total}</p>
          </div>
        </div>

        <div className="dc-modal-body overflow-y-auto shrink p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {paymentState.pending && !isSaving && <p role="status" className="text-sm text-slate-600">Já existe uma baixa em processamento para este título. Aguarde a conclusão.</p>}
            {paymentState.refreshSnapshot && <p role="status" className="text-sm text-slate-600">Atualize o saldo antes de registrar outro recebimento.</p>}
            {loading && <p role="status" className="text-sm text-slate-600">Carregando contas e formas de movimentação…</p>}
            {loadError && <p role="alert" className="text-sm text-rose-700">Não foi possível carregar as opções. <button type="button" className="dc-button underline" onClick={() => setLoadAttempt(n => n + 1)}>Tentar novamente</button></p>}
            {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
            <fieldset disabled={isSaving || paymentBlocked} className="space-y-4 min-w-0">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-desconto`} className="block text-xs font-medium text-emerald-600 normal-case mb-2 tracking-normal ml-1">Desconto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                  <input id={`${formId}-desconto`}
                    type="text"
                    value={descontoRaw}
                    onChange={e => {
                      const masked = maskCurrency(e.target.value);
                      setDescontoRaw(masked);
                      setValorDesconto(parseCurrencyToNumber(masked));
                    }}
                    className="dc-input w-full bg-white border-2 border-slate-100 rounded-xl px-5 py-3 pl-10 text-lg font-medium text-[#111827] outline-none focus:border-emerald-500 transition-all text-right"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${formId}-acrescimo`} className="block text-xs font-medium text-rose-600 normal-case mb-2 tracking-normal ml-1">Acréscimo (Juros)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                  <input id={`${formId}-acrescimo`}
                    type="text"
                    value={acrescimoRaw}
                    onChange={e => {
                      const masked = maskCurrency(e.target.value);
                      setAcrescimoRaw(masked);
                      setValorAcrescimo(parseCurrencyToNumber(masked));
                    }}
                    className="dc-input w-full bg-white border-2 border-slate-100 rounded-xl px-5 py-3 pl-10 text-lg font-medium text-[#111827] outline-none focus:border-rose-500 transition-all text-right"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-pago`} className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Valor a ser Efetivamente {titulo.tipo === 'PAGAR' ? 'pago' : 'recebido'}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                <input id={`${formId}-pago`}
                  type="text"
                  value={pagoRaw}
                  onChange={e => {
                    const masked = maskCurrency(e.target.value);
                    setPagoRaw(masked);
                    setValorPago(parseCurrencyToNumber(masked));
                  }}
                  className="dc-input w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-4 pl-12 text-2xl font-medium text-[#111827] outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              {valorPago > 0 && valorPago < (saldoDevedorOriginal + valorAcrescimo - valorDesconto) && (
                <p className="text-xs text-amber-600 font-medium normal-case mt-2 ml-1">💡 Atenção: Baixa menor que o saldo final (Liquidará Parcialmente).</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-data`} className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Data de Pagamento</label>
              <input id={`${formId}-data`}
                type="date"
                max={inline ? todayLocal() : undefined}
                required
                value={dataPagamento}
                onChange={e => setDataPagamento(e.target.value)}
                className="dc-input w-full bg-white border-2 border-slate-100 rounded-xl px-5 py-3 text-lg font-medium text-[#111827] outline-none focus:border-indigo-500 transition-all font-sans"
              />
            </div>

            {valorPago > 0 && (
              <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label htmlFor={`${formId}-conta`} className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Conta Bancária / Caixa</label>
                  <select id={`${formId}-conta`}
                    required={valorPago > 0}
                    value={contaId}
                    onChange={e => setContaId(e.target.value)}
                    className="dc-input w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#111827] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">Selecione a conta...</option>
                    {contas.map(c => <option key={c.id} value={c.id}>{formatContaBancaria(c)}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor={`${formId}-forma`} className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Forma de Movimentação</label>
                  <select id={`${formId}-forma`}
                    required={valorPago > 0}
                    value={formaId}
                    onChange={e => setFormaId(e.target.value)}
                    className="dc-input w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#111827] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  >
                    <option value="">Selecione a forma...</option>
                    {formas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
              </div>
            )}

            </fieldset>
            <div className="flex space-x-3 pt-4 pb-2">
              <button type="button" disabled={isSaving} onClick={onClose} className="dc-button flex-1 py-4 text-slate-500 font-semibold text-xs normal-case bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">Cancelar</button>
              <button
                type="submit"
                disabled={isSaving || paymentBlocked || loading || loadError}
                className={`dc-button flex-1 py-4 text-white font-semibold text-xs normal-case tracking-normal rounded-xl shadow-sm transition-all active:scale-100 ${titulo.tipo === 'PAGAR' ? 'bg-rose-600 hover:bg-rose-700 shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-none'
                  }`}
              >
                {isSaving ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalBaixa;
