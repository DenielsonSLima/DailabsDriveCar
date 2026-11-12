import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ITituloPagar } from '../contas-pagar.types';

interface Props {
  items: ITituloPagar[] | { [key: string]: ITituloPagar[] };
  loading: boolean;
  isGrouped?: boolean;
  onPagar: (titulo: ITituloPagar) => void;
  onViewDetails: (titulo: ITituloPagar) => void;
  onEdit: (titulo: ITituloPagar) => void;
  onDelete: (id: string) => void;
  viewMode?: 'table' | 'card';
}

import PagarCard from './PagarCard';

const PagarList: React.FC<Props> = ({ items, loading, isGrouped, onPagar, onViewDetails, onEdit, onDelete, viewMode = 'table' }) => {
  const navigate = useNavigate();
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium normal-case text-xs tracking-normal">Sincronizando compromissos...</p>
    </div>
  );

  const getStatusStyle = (status: string, vencimento: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    if (status === 'PAGO') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (vencimento < hoje) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (status === 'PARCIAL') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const renderTable = (rows: ITituloPagar[]) => (
    <div className="overflow-x-auto">
      <table className="dc-table w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-xs font-semibold text-slate-400 normal-case tracking-normal">
            <th className="px-4 py-3">Vencimento</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Favorecido / Documento</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3 text-right">Valor Total</th>
            <th className="px-4 py-3 text-right">Valor Pago</th>
            <th className="px-4 py-3 text-right">Pendente</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-slate-50 transition-colors group cursor-pointer"
              onClick={() => onViewDetails(t)}
            >
              <td className="px-4 py-4">
                <p className="text-xs font-medium text-slate-900">{formatDate(t.data_vencimento)}</p>
                <p className="text-xs text-slate-500 font-medium normal-case mt-0.5">Ref: {t.documento_ref || 'N/D'}</p>
              </td>
              <td className="px-4 py-4">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium normal-case tracking-normal border ${getStatusStyle(t.status, t.data_vencimento)}`}>
                  {t.data_vencimento < new Date().toISOString().split('T')[0] && t.status !== 'PAGO' ? 'ATRASADO' : t.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <p className="text-xs font-medium text-slate-700 normal-case truncate max-w-[220px]">{t.parceiro?.nome || t.descricao}</p>
                {t.pedido_id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/pedidos-compra/${t.pedido_id}`); }}
                    className="dc-button flex items-center mt-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 normal-case tracking-tight"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Ver Pedido de Compra
                  </button>
                )}
              </td>
              <td className="px-4 py-4">
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 normal-case tracking-normal">
                  {t.categoria?.nome || 'DIVERSOS'}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(t.valor_total)}</p>
              </td>
              <td className="px-4 py-4 text-right">
                <p className={`text-sm font-semibold ${t.valor_pago > 0 ? 'text-emerald-600' : 'text-slate-500 opacity-40'}`}>
                  {formatCurrency(t.valor_pago)}
                </p>
              </td>
              <td className="px-4 py-4 text-right">
                <p className={`text-sm font-semibold ${t.valor_total + (t.valor_acrescimo || 0) - t.valor_pago - (t.valor_desconto || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(t.valor_total + (t.valor_acrescimo || 0) - t.valor_pago - (t.valor_desconto || 0))}
                </p>
              </td>
              <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end space-x-2">
                  {t.status !== 'PAGO' && (
                    <button
                      onClick={() => onPagar(t)}
                      className="dc-button px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      Pagar
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(t)}
                    className="dc-button p-2 text-slate-300 hover:text-indigo-600 rounded-lg transition-colors focus:outline-none"
                    title="Editar Título"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onDelete(t.id)} className="dc-button p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors focus:outline-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!isGrouped) {
    const list = items as ITituloPagar[];
    if (list.length === 0) return (
      <div className="py-32 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center mb-4 text-slate-200">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="dc-section-title text-slate-900 font-semibold text-lg normal-case tracking-tight">Sem contas pendentes</h3>
        <p className="text-slate-500 text-xs font-medium normal-case tracking-normal mt-1">Sua agenda financeira está em dia para este filtro.</p>
      </div>
    );

    if (viewMode === 'card') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {list.map((t) => (
            <PagarCard
              key={t.id}
              titulo={t}
              onOpenDetails={onViewDetails}
              onDelete={onDelete}
            />
          ))}
        </div>
      );
    }

    return renderTable(list);
  }

  const grouped = items as { [key: string]: ITituloPagar[] };
  const keys = Object.keys(grouped).sort();

  return (
    <div className="divide-y divide-slate-100">
      {keys.map(groupKey => (
        <div key={groupKey} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-50/80 px-4 py-3 sticky top-0 z-10 backdrop-blur-sm border-y border-slate-100 flex items-center">
            <div className={`w-1.5 h-1.5 rounded-full mr-3 ${groupKey === 'PAGO' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <h3 className="dc-section-title text-xs font-semibold text-slate-600 normal-case tracking-normal">{groupKey}</h3>
            <span className="ml-auto text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-100 normal-case">{grouped[groupKey].length} Títulos</span>
          </div>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
              {grouped[groupKey].map((t) => (
                <PagarCard
                  key={t.id}
                  titulo={t}
                  onOpenDetails={onViewDetails}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : (
            renderTable(grouped[groupKey])
          )}
        </div>
      ))}
    </div>
  );
};

export default PagarList;
