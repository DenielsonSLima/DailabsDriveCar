
import React, { useState, useEffect } from 'react';
import {
  ENTRADA_LOTE_DESCRICAO_MAX,
  ENTRADA_LOTE_MAX,
  type EntradaLoteInput,
  type IPedidoCompra,
} from '../../pedidos-compra.types';
import { CondicoesPagamentoService } from '../../../cadastros/condicoes-pagamento/condicoes-pagamento.service';
import { ContasBancariasService } from '../../../ajustes/contas-bancarias/contas.service';
import { FinanceiroService } from '../../../financeiro/financeiro.service';

interface Props {
  pedido: IPedidoCompra;
  onClose: () => void;
  onConfirm: (params: { condicao: any, contaId?: string, lote?: EntradaLoteInput }) => void;
  isLoading: boolean;
  initialMode?: 'individual' | 'lote';
  error?: string;
}

const ModalConfirmacaoFinanceira: React.FC<Props> = ({ pedido, onClose, onConfirm, isLoading, initialMode = 'individual', error }) => {
  const [condicoes, setCondicoes] = useState<any[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [selectedCondicaoId, setSelectedCondicaoId] = useState('');
  const [selectedContaId, setSelectedContaId] = useState('');
  const [parcelasPrevia, setParcelasPrevia] = useState<any[]>([]);
  const [entrada, setEntrada] = useState(initialMode);
  const [quantidade, setQuantidade] = useState('');
  const [descricao, setDescricao] = useState('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Condição virtual "À VISTA" para formas sem condições cadastradas (ex: PIX, Dinheiro)
  const CONDICAO_AVISTA_AUTO = {
    id: '__auto_avista__',
    nome: 'À VISTA (Automático)',
    qtd_parcelas: 1,
    dias_primeira_parcela: 0,
    dias_entre_parcelas: 0,
    ativo: true,
  };

  useEffect(() => {
    if (pedido.forma_pagamento_id) {
      CondicoesPagamentoService.getByFormaPagamento(pedido.forma_pagamento_id).then(data => {
        if (data.length === 0) {
          // Nenhuma condição cadastrada → gera opção "À VISTA" automática
          setCondicoes([CONDICAO_AVISTA_AUTO as any]);
          setSelectedCondicaoId(CONDICAO_AVISTA_AUTO.id);
        } else {
          setCondicoes(data);

          // Se já houver um pagamento lançado com uma condição, tenta pré-selecionar ela
          if (pedido.pagamentos && pedido.pagamentos.length > 0) {
            const firstPaymentWithCond = pedido.pagamentos.find(p => p.condicao_id);
            if (firstPaymentWithCond) {
              setSelectedCondicaoId(firstPaymentWithCond.condicao_id);
            }
          }
        }
      });
    }
    ContasBancariasService.getAll().then(data => {
      const active = data.filter((c: any) => c.ativo);
      setContas(active);
      if (active.length === 1) {
        setSelectedContaId(active[0].id);
      }
    });
  }, [pedido.forma_pagamento_id, pedido.pagamentos]);

  useEffect(() => {
    if (selectedCondicaoId && pedido.valor_negociado > 0) {
      const isAuto = selectedCondicaoId.startsWith('__auto');
      const cond = condicoes.find(c => c.id === selectedCondicaoId);

      FinanceiroService.previewCronograma({
        valorTotal: pedido.valor_negociado,
        condicaoId: isAuto ? undefined : selectedCondicaoId,
        tipo: 'COMPRA',
        qtdParcelas: isAuto ? CONDICAO_AVISTA_AUTO.qtd_parcelas : undefined,
        diasPrimeira: isAuto ? CONDICAO_AVISTA_AUTO.dias_primeira_parcela : undefined,
        diasEntre: isAuto ? CONDICAO_AVISTA_AUTO.dias_entre_parcelas : undefined
      }).then(setParcelasPrevia);
    } else {
      setParcelasPrevia([]);
    }
  }, [selectedCondicaoId, pedido.valor_negociado, condicoes]);

  const selectedCondicao = condicoes.find(c => c.id === selectedCondicaoId);

  const requiresAccount = parcelasPrevia.some(p => p.data_vencimento === new Date().toISOString().split('T')[0]) &&
    pedido.forma_pagamento?.destino_lancamento === 'CAIXA';

  const veiculo = pedido.veiculos?.length === 1 ? pedido.veiculos[0] : null;
  const compraPropria = !pedido.forma_pagamento?.nome?.toLowerCase().includes('consigna');
  const lotePermitido = pedido.status === 'RASCUNHO' && compraPropria && !!veiculo?.id &&
    !veiculo.lote_id && !veiculo.is_consignado;
  const totalUnidades = Number(quantidade);
  const quantidadeValida = Number.isInteger(totalUnidades) && totalUnidades >= 2 && totalUnidades <= ENTRADA_LOTE_MAX;
  const descricaoValida = descricao.trim().length > 0 && descricao.trim().length <= ENTRADA_LOTE_DESCRICAO_MAX;
  const finalizarEmLote = entrada === 'lote';
  const confirmarHabilitado = !isLoading && !!selectedCondicaoId && (!requiresAccount || !!selectedContaId) &&
    (!finalizarEmLote || (lotePermitido && quantidadeValida && descricaoValida));

  return (
    <div data-drivecar-ui className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="finalizar-compra-titulo" className="dc-modal bg-white w-full max-w-2xl rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="dc-modal-header flex justify-between items-center bg-white text-slate-900 border-b border-slate-200">
          <div>
            <h3 id="finalizar-compra-titulo" className="dc-modal-title">Finalizar Compra</h3>
            <p className="text-xs text-indigo-400 font-semibold normal-case tracking-normal mt-1">Geração de Obrigações Financeiras</p>
          </div>
          <button type="button" aria-label="Fechar" disabled={isLoading} onClick={onClose} className="dc-button p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="dc-modal-body flex-1 overflow-y-auto p-4 space-y-6">
          <fieldset disabled={isLoading} className="space-y-3">
            <legend className="mb-2 text-sm font-semibold text-slate-800">Tipo de entrada</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${!finalizarEmLote ? 'border-indigo-400 bg-indigo-50 text-indigo-900' : 'border-slate-200 text-slate-700'}`}>
                <input type="radio" name="tipo-entrada" value="individual" checked={!finalizarEmLote} onChange={() => setEntrada('individual')} className="accent-indigo-600" />
                Individual
              </label>
              <label className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${finalizarEmLote ? 'border-indigo-400 bg-indigo-50 text-indigo-900' : 'border-slate-200 text-slate-700'} ${lotePermitido ? 'cursor-pointer' : 'opacity-60'}`}>
                <input type="radio" name="tipo-entrada" value="lote" checked={finalizarEmLote} disabled={!lotePermitido} onChange={() => setEntrada('lote')} className="accent-indigo-600" />
                Lote
              </label>
            </div>
            {!lotePermitido && (
              <p className="text-sm text-amber-800">
                Para lançar um lote, use um pedido em rascunho de compra própria com só uma ficha representando todas as unidades.
              </p>
            )}
            {finalizarEmLote && lotePermitido && (
              <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 sm:p-4">
                <p className="text-sm text-indigo-950">Esta compra cria um novo card em <strong>Estoque → Lotes</strong>. O valor total será dividido entre as unidades sem alterar lotes anteriores.</p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <label className="block space-y-1 text-sm font-semibold text-slate-700">
                    <span>Quantidade de unidades</span>
                    <input type="number" inputMode="numeric" min={2} max={ENTRADA_LOTE_MAX} step={1} required aria-invalid={quantidade !== '' && !quantidadeValida} aria-describedby="limite-quantidade-lote"
                      className="dc-input w-full rounded-xl border border-slate-200 bg-white p-2.5" placeholder="Ex.: 12" value={quantidade} onChange={event => setQuantidade(event.target.value)} />
                  </label>
                  <label className="block space-y-1 text-sm font-semibold text-slate-700">
                    <span>Descrição do lote</span>
                    <input type="text" required maxLength={ENTRADA_LOTE_DESCRICAO_MAX}
                      className="dc-input w-full rounded-xl border border-slate-200 bg-white p-2.5" placeholder="Ex.: Motos elétricas · Novembro" value={descricao} onChange={event => setDescricao(event.target.value)} />
                  </label>
                </div>
                <p id="limite-quantidade-lote" className={`text-xs ${quantidade !== '' && !quantidadeValida ? 'font-semibold text-rose-700' : 'text-indigo-900'}`}>
                  Informe um número inteiro entre 2 e {ENTRADA_LOTE_MAX.toLocaleString('pt-BR')}.
                  {quantidadeValida && ` Custo médio: ${formatCurrency(pedido.valor_negociado / totalUnidades)} por unidade.`}
                </p>
              </div>
            )}
          </fieldset>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Valor Negociado</p>
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(pedido.valor_negociado)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Forma de Pagamento</p>
              <p className="text-lg font-semibold text-indigo-600 normal-case">{pedido.forma_pagamento?.nome}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-500 normal-case tracking-normal ml-1">Regra de Parcelamento (Condição)</label>
            <select
              value={selectedCondicaoId}
              onChange={e => setSelectedCondicaoId(e.target.value)}
              className="dc-input w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-2.5 font-medium text-slate-800 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">Escolha a condição de pagamento...</option>
              {condicoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            {requiresAccount && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl animate-in slide-in-from-left">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-xs text-emerald-800 font-semibold normal-case leading-relaxed">Pagamento à Vista: Selecione de qual conta sairá o saldo para a primeira parcela hoje.</p>
                </div>
                <select
                  value={selectedContaId}
                  onChange={e => setSelectedContaId(e.target.value)}
                  className="dc-input w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-emerald-700 outline-none"
                >
                  <option value="">Selecione a Conta Bancária...</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} - {c.titular} | Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saldo_atual || 0)}</option>)}
                </select>
              </div>
            )}

            {parcelasPrevia.length > 0 && (
              <div className="space-y-2">
                <h4 className="dc-section-title font-semibold text-slate-400 normal-case tracking-normal px-1">Prévia dos Lançamentos</h4>
                <div className="grid grid-cols-1 gap-2">
                  {parcelasPrevia.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-400">{p.numero}</span>
                        <span className="text-xs font-semibold text-slate-700">{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{formatCurrency(p.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dc-modal-footer p-4 border-t border-slate-100 bg-slate-50">
          {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button
            type="button"
            onClick={() => {
              if (!confirmarHabilitado) return;
              // Se for condição virtual "À VISTA", envia o objeto diretamente (sem ID fake)
              const condicaoParaEnviar = selectedCondicaoId === '__auto_avista__'
                ? { nome: 'À VISTA', qtd_parcelas: 1, dias_primeira_parcela: 0, dias_entre_parcelas: 0 }
                : selectedCondicao!;
              onConfirm({
                condicao: condicaoParaEnviar,
                contaId: selectedContaId,
                ...(finalizarEmLote ? { lote: { quantidade: totalUnidades, descricao: descricao.trim() } } : {}),
              });
            }}
            disabled={!confirmarHabilitado}
            className="dc-button w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-30 flex items-center justify-center"
          >
            {isLoading ? 'Confirmando Operação...' : finalizarEmLote ? 'Confirmar entrada em lote' : 'Gerar Títulos e Confirmar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoFinanceira;
