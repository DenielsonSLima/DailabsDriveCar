import React from 'react';
import { ITituloCredito } from '../outros-creditos.types';

interface Props {
  items: ITituloCredito[] | { [key: string]: ITituloCredito[] };
  loading: boolean;
  isGrouped: boolean;
  onReceber: (titulo: ITituloCredito) => void;
  onEdit: (titulo: ITituloCredito) => void;
  onDelete: (id: string) => void;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

const CreditosList: React.FC<Props> = ({ items, loading, isGrouped, onReceber, onEdit, onDelete, pagination }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando aportes...</p>
    </div>
  );

  const renderTable = (rows: ITituloCredito[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-5">Vencimento</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5">Descrição / Origem</th>
            <th className="px-8 py-5">Destino / Conta</th>
            <th className="px-8 py-5 text-right">Valor Total</th>
            <th className="px-8 py-5 text-right w-20">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
              onClick={() => onReceber(t)}
            >
              <td className="px-8 py-6">
                <p className="text-xs font-black text-slate-900">{formatDate(t.data_vencimento)}</p>
              </td>
              <td className="px-8 py-6">
                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${t.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-teal-50 text-teal-600 border-teal-100'
                  }`}>
                  {t.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-slate-700 uppercase truncate max-w-[200px]">{t.descricao}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{t.parceiro?.nome || t.categoria?.nome}</p>
              </td>
              <td className="px-8 py-6">
                {(() => {
                  const conta = t.transacoes?.[0]?.conta_origem;
                  return conta ? (
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-slate-600 uppercase">{conta.banco_nome}</p>
                      <p className="text-[9px] text-slate-400 font-mono">CC: {conta.conta}</p>
                    </div>
                  ) : <span className="text-[9px] text-slate-300 font-bold uppercase">Não Definida</span>;
                })()}
              </td>
              <td className="px-8 py-6 text-right">
                <p className="text-sm font-black text-teal-600">{formatCurrency(t.valor_total)}</p>
              </td>
              <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors" title="Excluir">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPagination = () => {
    if (!pagination) return null;
    const { currentPage, pageSize, totalItems, onPageChange } = pagination;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-8 py-6 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Mostrando {currentPage * pageSize + 1} a {Math.min((currentPage + 1) * pageSize, totalItems)} de {totalItems} registros
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-30 enabled:hover:bg-slate-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl">
            <span className="text-xs font-black text-slate-900">{currentPage + 1}</span>
            <span className="text-[10px] font-bold text-slate-300 mx-1">/</span>
            <span className="text-[10px] font-bold text-slate-400">{totalPages}</span>
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-30 enabled:hover:bg-slate-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    );
  };

  const content = () => {
    if (!isGrouped) {
      const list = items as ITituloCredito[];
      if (list.length === 0) return <div className="py-32 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-3xl mx-8">Nenhum crédito extraordinário encontrado</div>;
      return renderTable(list);
    }

    const grouped = items as { [key: string]: ITituloCredito[] };
    const keys = Object.keys(grouped).sort();

    return (
      <div className="divide-y divide-slate-100">
        {keys.map(groupKey => (
          <div key={groupKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-50/80 px-8 py-3 sticky top-0 z-10 backdrop-blur-sm border-y border-slate-100 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-3"></div>
              <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">{groupKey}</h3>
              <span className="ml-auto text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 uppercase">{grouped[groupKey].length} Créditos</span>
            </div>
            {renderTable(grouped[groupKey])}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {content()}
      {renderPagination()}
    </>
  );
};
export default CreditosList;
