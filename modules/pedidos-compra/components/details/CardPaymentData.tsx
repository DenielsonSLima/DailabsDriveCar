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
  const valorReferencia = totalAquisicaoReferencia || pedido.valor_negociado || 0;
  const valorRestante = valorReferencia - valorTotalPagos;
  const percentualPago = Math.min(100, (valorTotalPagos / (valorReferencia || 1)) * 100);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo do Veículo</p>
          <p className="text-xl font-black text-slate-900">{formatCurrency(valorReferencia)}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Lançado</p>
          <p className="text-xl font-black text-emerald-700">{formatCurrency(valorTotalPagos)}</p>
        </div>
        <div className={`p-6 rounded-3xl border ${valorRestante > 0.05 ? 'bg-rose-50 border-rose-100' : 'bg-indigo-50 border-indigo-100'}`}>
          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${valorRestante > 0.05 ? 'text-rose-600' : 'text-indigo-600'}`}>
            {valorRestante > 0.05 ? 'Saldo a Compor' : 'Quitação Confirmada'}
          </p>
          <p className={`text-xl font-black ${valorRestante > 0.05 ? 'text-rose-700' : 'text-indigo-700'}`}>{formatCurrency(Math.max(0, valorRestante))}</p>
        </div>

        <div className="md:col-span-3">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-2 px-1">
            <span>Cobertura Financeira do Contrato</span>
            <span className={percentualPago >= 100 ? 'text-emerald-500' : 'text-indigo-500'}>{percentualPago.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${percentualPago >= 99.9 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
              style={{ width: `${percentualPago}%` }}
            />
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