import React, { useState } from 'react';
import { IPedidoCompra, IPedidoPagamento } from '../../pedidos-compra.types';
import ModalPaymentForm from './ModalPaymentForm';
import ConfirmModal from '../../../../components/ConfirmModal';

interface Props {
  pedido: IPedidoCompra;
  totalAquisicaoReferencia: number;
  onAddPayment: (data: Partial<IPedidoPagamento>[]) => void;
  onDeletePayment: (id: string) => void;
  isSaving: boolean;
}

const CardPaymentData: React.FC<Props> = ({ pedido, totalAquisicaoReferencia, onAddPayment, onDeletePayment, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const valorTotalPagos = (pedido.pagamentos || []).reduce((acc, p) => acc + p.valor, 0);
  const valorRealPago = (pedido.titulos || []).reduce((acc, t) => acc + (t.valor_pago || 0), 0);
  const valorReferencia = totalAquisicaoReferencia || pedido.valor_negociado || 0;
  const valorRestante = valorReferencia - valorTotalPagos;
  const percentualLancado = Math.min(100, (valorTotalPagos / (valorReferencia || 1)) * 100);
  const percentualRealPago = Math.min(100, (valorRealPago / (valorReferencia || 1)) * 100);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 animate-in slide-in-from-bottom-10 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center">
            <svg className="w-6 h-6 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            Composição do Pagamento
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de entradas e promessas financeiras</p>
        </div>

        {pedido.status !== 'CONCLUIDO' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Lançar Pagamento
          </button>
        )}
      </div>

      {/* Resumo Quitação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo do Veículo</p>
          <p className="text-lg font-black text-slate-900">{formatCurrency(valorReferencia)}</p>
        </div>
        <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Total Lançado (Negociado)</p>
          <p className="text-lg font-black text-indigo-700">{formatCurrency(valorTotalPagos)}</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Pago (Real)</p>
          <p className="text-lg font-black text-emerald-700">{formatCurrency(valorRealPago)}</p>
        </div>
        <div className={`p-5 rounded-3xl border ${valorReferencia - valorRealPago > 0.05 ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'}`}>
          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${valorReferencia - valorRealPago > 0.05 ? 'text-rose-600' : 'text-blue-600'}`}>
            {valorReferencia - valorRealPago > 0.05 ? 'Saldo em Aberto' : 'Quitação Confirmada'}
          </p>
          <p className={`text-lg font-black ${valorReferencia - valorRealPago > 0.05 ? 'text-rose-700' : 'text-blue-700'}`}>{formatCurrency(Math.max(0, valorReferencia - valorRealPago))}</p>
        </div>

        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <div>
            <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 mb-2 px-1">
              <span>Cobertura do Contrato (Programado)</span>
              <span className="text-indigo-500">{percentualLancado.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out bg-indigo-600"
                style={{ width: `${percentualLancado}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 mb-2 px-1">
              <span>Quitação Financeira Real</span>
              <span className="text-emerald-500">{percentualRealPago.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out bg-emerald-500"
                style={{ width: `${percentualRealPago}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="overflow-hidden border border-slate-100 rounded-3xl shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma / Condição</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pedido.pagamentos && pedido.pagamentos.length > 0 ? (
              pedido.pagamentos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-indigo-600">
                    {new Date(p.data_pagamento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{(p as any).forma_pagamento?.nome}</span>
                      {p.conta_bancaria && (
                        <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest mt-1 bg-indigo-50/50 px-1.5 py-0.5 rounded leading-none w-fit">
                          {p.conta_bancaria.banco_nome}
                        </span>
                      )}
                      {p.condicao_id && (
                        <span className="text-[9px] font-bold text-indigo-500 uppercase mt-1">{(p as any).condicao?.nome}</span>
                      )}
                      {p.observacao && <span className="text-[9px] text-slate-400 italic mt-1 font-medium">"{p.observacao}"</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-indigo-600 text-right">{formatCurrency(p.valor)}</td>
                  <td className="px-6 py-4 text-right">
                    {pedido.status !== 'CONCLUIDO' && (
                      <button
                        onClick={() => setDeleteTargetId(p.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                        title="Excluir Lançamento"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-300 italic text-xs uppercase font-bold tracking-widest">
                  Nenhum pagamento lançado para esta negociação.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Espelho do Financeiro */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h4 className="text-md font-black text-slate-900 uppercase tracking-tighter">Espelho Financeiro (Titulos & Baixas)</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Acompanhamento em tempo real do contas a pagar</p>
          </div>
        </div>

        <div className="space-y-4">
          {pedido?.titulos && pedido.titulos.length > 0 ? (
            pedido.titulos.map((titulo) => {
              const statusColors = {
                PAGO: 'bg-emerald-100 text-emerald-700',
                PARCIAL: 'bg-amber-100 text-amber-700',
                PENDENTE: 'bg-slate-100 text-slate-600',
                ATRASADO: 'bg-rose-100 text-rose-700',
                CANCELADO: 'bg-slate-200 text-slate-400'
              };

              const dataVencimento = titulo?.data_vencimento ? new Date(titulo.data_vencimento).toLocaleDateString('pt-BR') : '---';

              return (
                <div key={titulo.id} className="border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 transition-colors bg-slate-50/30">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${statusColors[titulo?.status as keyof typeof statusColors] || 'bg-slate-100'}`}>
                          {titulo?.status || 'PENDENTE'}
                        </span>
                        <span className="text-xs font-black text-slate-800 uppercase">
                          {titulo?.descricao || `Parcela ${titulo?.parcela_numero || 0}/${titulo?.parcela_total || 0}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <span>Vencimento: <span className="text-slate-900">{dataVencimento}</span></span>
                        {titulo?.categoria && <span>Categoria: <span className="text-indigo-600">{titulo.categoria?.nome || '---'}</span></span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center px-4 border-r border-slate-200">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(titulo?.valor_total || 0)}</p>
                    </div>

                    <div className="flex flex-col items-end justify-center px-4">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valor Pago</p>
                      <p className="text-sm font-black text-emerald-700">{formatCurrency(titulo?.valor_pago || 0)}</p>
                    </div>
                  </div>

                  {/* Transações deste título */}
                  {(titulo as any)?.transacoes && (titulo as any).transacoes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Histórico de Baixas</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(titulo as any).transacoes.map((tx: any) => {
                          const dataPagamento = tx?.data_pagamento ? new Date(tx.data_pagamento).toLocaleDateString('pt-BR') : '---';
                          return (
                            <div key={tx?.id} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-900">{dataPagamento}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[120px]">
                                  {tx?.conta?.banco_nome || tx?.forma?.nome || 'CAIXA'}
                                </span>
                              </div>
                              <span className="text-xs font-black text-emerald-600">{formatCurrency(tx?.valor || 0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-6 py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">
                Aguardando integração com o financeiro...
              </p>
              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                Os títulos aparecerão aqui após a confirmação do pedido.
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ModalPaymentForm
          pedidoId={pedido.id}
          formaPagamentoId={pedido.forma_pagamento_id}
          isSaving={isSaving}
          valorSugerido={valorRestante}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data) => {
            onAddPayment(data);
            setIsModalOpen(false);
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) onDeletePayment(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title="Excluir Lançamento?"
        message="Tem certeza que deseja remover este lançamento financeiro? O saldo do pedido será recalculado."
        confirmText="Excluir"
        isLoading={isSaving}
      />
    </div>
  );
};

export default CardPaymentData;