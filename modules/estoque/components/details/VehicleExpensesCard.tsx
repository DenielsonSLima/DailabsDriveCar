import React, { useState } from 'react';
import { IVeiculo, IVeiculoDespesa } from '../../estoque.types';
import ExpenseForm from './ExpenseForm';

interface Props {
  veiculo: IVeiculo;
  onAddExpense: (expenses: Partial<IVeiculoDespesa>[]) => void;
  onEditExpense: (expense: IVeiculoDespesa) => void;
  onDeleteExpense: (id: string) => void;
}

const VehicleExpensesCard: React.FC<Props> = ({ veiculo, onAddExpense, onEditExpense, onDeleteExpense }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm w-full animate-in slide-in-from-bottom-12 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center">
            <svg className="w-6 h-6 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Despesas e Serviços com o Veículo
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Gestão de custos e previsões financeiras vinculadas ao ativo.</p>
        </div>

        {veiculo.status !== 'VENDIDO' && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center shadow-lg active:scale-95"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
            Lançar Despesa
          </button>
        )}
      </div>

      <div className="overflow-hidden border border-slate-100 rounded-3xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Venc.</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria / Descrição</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {veiculo.despesas && veiculo.despesas.length > 0 ? (
              (veiculo.despesas as IVeiculoDespesa[]).map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">{new Date(d.data).toLocaleDateString('pt-BR')}</p>
                    {d.data_vencimento && d.status_pagamento === 'PENDENTE' && (
                      <p className="text-[9px] font-black text-rose-500 uppercase mt-0.5">Venc: {new Date(d.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${d.status_pagamento === 'PAGO'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                      }`}>
                      {d.status_pagamento}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase mb-1 inline-block w-fit">
                        {d.categoria_nome || 'DIVERSOS'}
                      </span>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[250px]">{d.descricao}</p>
                      {d.conta_bancaria && (
                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-1 bg-emerald-50/50 px-1.5 py-0.5 rounded leading-none w-fit">
                          {d.conta_bancaria.banco_nome}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-900 text-center">{d.quantidade}</td>
                  <td className="px-6 py-4 text-sm font-black text-indigo-600 text-right">{formatCurrency(d.valor_total)}</td>
                  <td className="px-6 py-4 text-right flex justify-end space-x-2">
                    <button
                      onClick={() => onEditExpense(d)}
                      className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                      title="Editar Despesa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => onDeleteExpense(d.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                      title="Excluir Despesa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-300 italic text-xs uppercase font-bold tracking-widest">
                  Nenhuma despesa lançada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <ExpenseForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={(data) => {
            onAddExpense(data);
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default VehicleExpensesCard;