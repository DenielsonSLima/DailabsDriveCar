import { buildPaymentSchedule } from '../../utils/payment-schedule';
import { todayLocal } from '../../../../utils/date';
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { IFormaPagamento } from '../../../cadastros/formas-pagamento/formas-pagamento.types';
import { ICondicaoRecebimento } from '../../../cadastros/condicoes-recebimento/condicoes-recebimento.types';
import { IContaBancaria } from '../../../ajustes/contas-bancarias/contas.types';
import { FormasPagamentoService } from '../../../cadastros/formas-pagamento/formas-pagamento.service';
import { CondicoesRecebimentoService } from '../../../cadastros/condicoes-recebimento/condicoes-recebimento.service';
import { ContasBancariasService } from '../../../ajustes/contas-bancarias/contas.service';
import { IPedidoVenda, IVendaPagamento } from '../../pedidos-venda.types';

interface IParcelaGerada {
  id_temporario: string;
  numero: number;
  data_vencimento: string;
  valor: number;
}

interface Props {
  pedido: IPedidoVenda;
  onClose: () => void;
  onSubmit: (data: Partial<IVendaPagamento>[]) => void;
  isSaving: boolean;
}

const ModalVendaPaymentForm: React.FC<Props> = ({ pedido, onClose, onSubmit, isSaving }) => {
  const [formas, setFormas] = useState<IFormaPagamento[]>([]);
  const [condicoes, setCondicoes] = useState<ICondicaoRecebimento[]>([]);
  const [contas, setContas] = useState<IContaBancaria[]>([]);
  const [loadingCondicoes, setLoadingCondicoes] = useState(false);
  const [commissionMode, setCommissionMode] = useState<'VALOR' | 'PERCENTUAL'>('VALOR');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [deduzirComissao, setDeduzirComissao] = useState(true);

  const [valorTotalACompor, setValorTotalACompor] = useState('R$ 0,00');
  const [formaId, setFormaId] = useState(pedido.forma_pagamento_id || '');
  const [condicaoId, setCondicaoId] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [observacao, setObservacao] = useState('');

  const [parcelas, setParcelas] = useState<IParcelaGerada[]>([]);
  const isConsignado = !!pedido.is_consignado;
  const valorVendaPedido = pedido.valor_venda || 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const parseCurrency = (value: string) => Number(value.replace(/\D/g, '')) / 100;

  useEffect(() => {
    async function loadInitial() {
      const [fData, cData] = await Promise.all([
        FormasPagamentoService.getAll(),
        ContasBancariasService.getAll()
      ]);
      // Filtra apenas recebimentos ou ambos
      setFormas(fData.filter(f => (f.tipo_movimentacao !== 'PAGAMENTO') && f.ativo));

      const activeContas = cData.filter(c => c.ativo);
      setContas(activeContas);
      if (activeContas.length === 1) {
        setContaBancariaId(activeContas[0].id);
      }
    }
    loadInitial();

    // Em consignação, o financeiro deve receber apenas comissão/lucro da loja.
    if (pedido.is_consignado) {
      setValorTotalACompor(formatCurrency(0));
      return;
    }

    // Define o valor total da venda como valor inicial sugerido para vendas próprias.
    const totalVenda = pedido.valor_venda || 0;
    const totalJaEstruturado = (pedido.pagamentos || []).reduce((acc, p) => acc + p.valor, 0);
    const saldo = Math.max(0, totalVenda - totalJaEstruturado);

    setValorTotalACompor(formatCurrency(saldo));
  }, [pedido]);

  useEffect(() => {
    if (formaId) {
      setLoadingCondicoes(true);
      CondicoesRecebimentoService.getByFormaPagamento(formaId).then(data => {
        setCondicoes(data.filter(c => c.ativo));
        setLoadingCondicoes(false);
      });
    } else {
      setCondicoes([]);
    }
    setCondicaoId('');
    setParcelas([]);
  }, [formaId]);

  useEffect(() => {
    const condicao = condicoes.find(c => c.id === condicaoId);
    const valorNumerico = parseCurrency(valorTotalACompor);

    if (condicao && condicao.qtd_parcelas > 0 && Math.round(valorNumerico * 100) >= condicao.qtd_parcelas) {
      const novasParcelas = buildPaymentSchedule(valorNumerico, pedido.data_venda, condicao)
        .map(p => ({ ...p, id_temporario: String(p.numero) }));
      setParcelas(novasParcelas);
    } else {
      setParcelas([]);
    }
  }, [condicaoId, valorTotalACompor, condicoes, pedido.data_venda]);

  const hasRecebimentoHoje = useMemo(() => {
    const hoje = todayLocal();
    return parcelas.some(p => p.data_vencimento <= hoje);
  }, [parcelas]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    const numericValue = Number(value) / 100;
    const formatted = formatCurrency(numericValue);
    if (isConsignado) {
      setCommissionMode('VALOR');
      setCommissionPercent('');
    }
    setValorTotalACompor(formatted);
  };

  const handleCommissionPercentChange = (value: string) => {
    setCommissionMode('PERCENTUAL');
    setCommissionPercent(value);
    const percent = Number(value.replace(',', '.')) || 0;
    setValorTotalACompor(formatCurrency(Math.max(0, valorVendaPedido * (percent / 100))));
  };

  const updateParcelaDate = (id: string, newDate: string) => {
    setParcelas(prev => prev.map(p => p.id_temporario === id ? { ...p, data_vencimento: newDate } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parcelas.length === 0) return;

    if (hasRecebimentoHoje && !contaBancariaId) {
      alert("Para recebimentos à vista ou retroativos, selecione a conta bancária de destino.");
      return;
    }

    const observacaoConsignacao = isConsignado
      ? `Consignação: comissão ${deduzirComissao ? 'deduzida do valor de venda' : 'sem dedução do valor de venda'}. ${observacao}`.trim()
      : observacao;

    const payload: Partial<IVendaPagamento>[] = parcelas.map(p => ({
      pedido_id: pedido.id,
      data_recebimento: p.data_vencimento,
      forma_pagamento_id: formaId,
      condicao_id: condicaoId,
      conta_bancaria_id: p.data_vencimento <= todayLocal() ? contaBancariaId : undefined,
      valor: p.valor,
      observacao: parcelas.length > 1 ? `Recebimento Parcela ${p.numero}/${parcelas.length} - ${observacaoConsignacao}` : observacaoConsignacao
    }));

    onSubmit(payload);
  };
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const valorComissao = parseCurrency(valorTotalACompor);
  const repasseEstimado = Math.max(0, valorVendaPedido - valorComissao);

  const content = (
    <div data-drivecar-ui className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="dc-modal bg-white w-full max-w-2xl rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col max-h-[95vh]">

        <div className="dc-modal-header flex justify-between items-center">
          <div>
            <h3 className="dc-modal-title">{isConsignado ? 'Comissão da Consignação' : 'Estruturar Recebimento'}</h3>
            <p className="text-xs text-slate-400 font-semibold normal-case tracking-normal mt-1">{isConsignado ? 'Registrar lucro/comissão da loja' : 'Configurar cronograma de entrada financeira'}</p>
          </div>
          <button onClick={onClose} className="dc-button p-2 hover:bg-white rounded-full text-slate-400 hover:text-rose-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dc-modal-body flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">

          {isConsignado && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-violet-400 normal-case tracking-normal mb-1">Venda consignada</p>
                  <p className="text-sm font-semibold text-violet-950">Valor de venda: {formatCurrency(valorVendaPedido)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeduzirComissao(prev => !prev)}
                  className={`dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all ${deduzirComissao ? 'bg-violet-700 text-white' : 'bg-white text-violet-700 border border-violet-200'}`}
                >
                  {deduzirComissao ? 'Deduz da venda' : 'Não deduz'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-white/70 p-1 rounded-2xl border border-violet-100">
                <button
                  type="button"
                  onClick={() => setCommissionMode('VALOR')}
                  className={`dc-button py-2 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all ${commissionMode === 'VALOR' ? 'bg-violet-700 text-white shadow-md' : 'text-violet-400 hover:text-violet-700'}`}
                >
                  Valor
                </button>
                <button
                  type="button"
                  onClick={() => setCommissionMode('PERCENTUAL')}
                  className={`dc-button py-2 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all ${commissionMode === 'PERCENTUAL' ? 'bg-violet-700 text-white shadow-md' : 'text-violet-400 hover:text-violet-700'}`}
                >
                  Porcentagem
                </button>
              </div>

              {commissionMode === 'PERCENTUAL' && (
                <div>
                  <label className="block text-xs font-semibold text-violet-400 normal-case mb-2 ml-1 tracking-normal">Percentual de comissão</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={commissionPercent}
                      onChange={e => handleCommissionPercentChange(e.target.value)}
                      className="dc-input w-full bg-white border-2 border-violet-100 rounded-xl px-4 py-2.5 pr-10 text-xl font-semibold text-violet-900 outline-none focus:border-violet-500 transition-all text-center shadow-sm"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 font-semibold">%</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-semibold normal-case tracking-normal text-violet-500">
                <span>Comissão: {formatCurrency(valorComissao)}</span>
                {deduzirComissao && <span>Repasse estimado: {formatCurrency(repasseEstimado)}</span>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">{isConsignado ? 'Lucro / Comissão' : 'Valor do Lote'}</label>
              <input
                type="text"
                value={valorTotalACompor}
                onChange={handleCurrencyChange}
                className="dc-input w-full bg-white border-2 border-emerald-100 rounded-xl px-4 py-2.5 text-xl font-semibold text-emerald-600 outline-none focus:border-emerald-500 transition-all text-center shadow-sm hover:shadow-md"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Modalidade</label>
              <select
                required
                value={formaId}
                onChange={e => setFormaId(e.target.value)}
                className="dc-input w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none shadow-sm hover:shadow-md transition-all"
              >
                <option value="">Selecione...</option>
                {formas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal flex justify-between">
                Regra / Prazo
                {loadingCondicoes && <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>}
              </label>
              <select
                required
                disabled={!formaId}
                value={condicaoId}
                onChange={e => setCondicaoId(e.target.value)}
                className="dc-input w-full bg-white border border-indigo-100 rounded-xl px-4 py-3.5 text-xs font-medium text-indigo-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none shadow-sm hover:shadow-md transition-all disabled:opacity-30"
              >
                <option value="">{loadingCondicoes ? 'Buscando...' : 'Escolha a regra...'}</option>
                {condicoes.map(c => <option key={c.id} value={c.id}>{c.nome} — {c.qtd_parcelas}x, primeira em {c.dias_primeira_parcela} dias</option>)}
              </select>
            </div>
          </div>

          {parcelas.length > 0 && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-1">
                <h4 className="dc-section-title font-semibold text-slate-400 normal-case tracking-normal">Cronograma de Entradas</h4>
                <span className="text-xs font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded normal-case shadow-sm">Estrutura de {parcelas.length}x</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {parcelas.map((p) => (
                  <div key={p.id_temporario} className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl hover:border-emerald-200 transition-all group shadow-sm hover:shadow-md">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-semibold text-slate-400 text-xs shadow-sm">
                      {p.numero}º
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-400 normal-case mb-1">Previsão de Crédito</p>
                      <input
                        type="date"
                        value={p.data_vencimento}
                        onChange={(e) => updateParcelaDate(p.id_temporario, e.target.value)}
                        className="dc-input bg-transparent font-semibold text-slate-800 outline-none cursor-pointer focus:text-emerald-600"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400 normal-case mb-1">Valor</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasRecebimentoHoje && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-4 animate-in slide-in-from-left duration-500">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-200 shrink-0">
                  {/* Fixed malformed SVG tag on line 231 */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="dc-section-title font-semibold text-emerald-800 normal-case tracking-normal mb-1">Crédito Imediato</h4>
                  <p className="text-xs text-emerald-600 font-medium">Lançamentos à vista ou com data retroativa alimentarão o saldo da conta selecionada abaixo.</p>
                </div>
              </div>
              <select
                required
                value={contaBancariaId}
                onChange={e => setContaBancariaId(e.target.value)}
                className="dc-input w-full bg-white border-2 border-emerald-200 rounded-xl px-5 py-2.5 text-xs font-semibold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer shadow-sm"
              >
                <option value="">Onde o dinheiro cairá?</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} - {c.titular} | Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saldo_atual || 0)}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Observações do Recebimento</label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Ex: Entrada via PIX efetuada no ato da assinatura..."
              rows={2}
              className="dc-input w-full bg-white border border-slate-200 rounded-xl px-5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none shadow-sm hover:shadow-md transition-all"
            />
          </div>
        </form>

        <div className="dc-modal-footer p-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || parcelas.length === 0}
            className="dc-button w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-emerald-700 shadow-sm shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
            )}
            <span>{isSaving ? 'Gravando Recebimento...' : 'Finalizar Lançamento'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ModalVendaPaymentForm;
