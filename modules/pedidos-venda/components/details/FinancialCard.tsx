import React, { useState } from 'react';
import { IPedidoVenda, IVendaPagamento } from '../../pedidos-venda.types';
import ModalVendaPaymentForm from './ModalVendaPaymentForm';

interface Props {
  pedido: IPedidoVenda;
  valorVendaEfetivo: number;
  onAddPayments: (payments: Partial<IVendaPagamento>[]) => void;
  onDeletePayment: (id: string) => void;
  isSaving: boolean;
}

const FinancialCard: React.FC<Props> = ({ pedido, valorVendaEfetivo, onAddPayments, onDeletePayment, isSaving }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const totalRecebido = (pedido.pagamentos || []).reduce((acc, p) => acc + p.valor, 0);
  const saldoRestante = valorVendaEfetivo - totalRecebido;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 animate-in slide-in-from-bottom-6 duration-700 w-full">
      {/* Header do Card com Botão de Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center">
            <svg className="w-6 h-6 mr-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Composição do Recebimento
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detalhamento financeiro da entrada de capital</p>
        </div>

        {!isSaving && pedido.status !== 'CONCLUIDO' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Lançamento
          </button>
        )}
      </div>

      {/* Grid de Informações Principais Lado a Lado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner group hover:border-indigo-200 transition-colors">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Data da Venda</p>
          <p className="text-xl font-black text-slate-800">{formatDate(pedido.data_venda)}</p>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner group hover:border-indigo-200 transition-colors">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Forma Principal</p>
          <p className="text-xl font-black text-slate-800 uppercase truncate" title={pedido.forma_pagamento?.nome}>
            {pedido.forma_pagamento?.nome || 'A Combinar'}
          </p>
        </div>

        <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
            {pedido.is_consignado ? 'Comissão da Empresa' : 'Valor Total Negociado'}
          </p>
          <h4 className="text-2xl font-black tracking-tight">{formatCurrency(valorVendaEfetivo)}</h4>
        </div>
      </div>

      {/* Indicador de Quitação */}
      <div className="mb-8 px-1">
        <div className="flex justify-between items-center text-[10px] font-black uppercase mb-2">
          <span className="text-slate-400">Progresso da Quitação</span>
          <span className={saldoRestante <= 0 ? 'text-emerald-500' : 'text-indigo-500'}>
            {formatCurrency(totalRecebido)} de {formatCurrency(valorVendaEfetivo)}
          </span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${saldoRestante <= 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-indigo-600'}`}
            style={{ width: `${Math.min(100, valorVendaEfetivo > 0 ? (totalRecebido / valorVendaEfetivo) * 100 : 0)}%` }}
          ></div>
        </div>
        {saldoRestante > 0 && (
          <p className="text-[9px] font-black text-rose-500 uppercase mt-2 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Pendente: {formatCurrency(saldoRestante)}
          </p>
        )}
      </div>

      {/* Tabela de Lançamentos */}
      <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-5">Data</th>
              <th className="px-6 py-5">Vencimento</th>
              <th className="px-6 py-5">Condição de Recebimento</th>
              <th className="px-6 py-5">Conta de Destino</th>
              <th className="px-6 py-5 text-right">Valor</th>
              {pedido.status !== 'CONCLUIDO' && <th className="px-6 py-5 text-right w-20">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pedido.pagamentos && pedido.pagamentos.length > 0 ? (
              pedido.pagamentos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">{new Date(p.created_at || new Date().toISOString()).toLocaleDateString('pt-BR')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{new Date(p.data_recebimento).toLocaleDateString('pt-BR')}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Vencimento</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{(p as any).forma_pagamento?.nome}</span>
                      {p.condicao_id && (
                        <span className="text-[9px] font-bold text-indigo-500 uppercase">{(p as any).condicao?.nome}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.conta_bancaria_id ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                          {(p as any).conta_bancaria?.banco_nome} • {(p as any).conta_bancaria?.conta}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase italic">Não vinculada</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right">
                    {formatCurrency(p.valor)}
                  </td>
                  {pedido.status !== 'CONCLUIDO' && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDeletePayment(p.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir Lançamento"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={pedido.status !== 'CONCLUIDO' ? 6 : 5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center opacity-30">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum recebimento estruturado.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ModalVendaPaymentForm
          pedido={pedido}
          isSaving={isSaving}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(data) => {
            onAddPayments(data);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default FinancialCard;