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
}

const PagarList: React.FC<Props> = ({ items, loading, isGrouped, onPagar, onViewDetails, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando compromissos...</p>
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
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-5">Vencimento</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5">Favorecido / Documento</th>
            <th className="px-8 py-5">Categoria</th>
            <th className="px-8 py-5 text-right">Valor Total</th>
            <th className="px-8 py-5 text-right">Valor Pago</th>
            <th className="px-8 py-5 text-right">Pendente</th>
            <th className="px-8 py-5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-slate-50 transition-colors group cursor-pointer"
              onClick={() => onViewDetails(t)}
            >
              <td className="px-8 py-6">
                <p className="text-xs font-black text-slate-900">{formatDate(t.data_vencimento)}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Ref: {t.documento_ref || 'N/D'}</p>
              </td>
              <td className="px-8 py-6">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(t.status, t.data_vencimento)}`}>
                  {t.data_vencimento < new Date().toISOString().split('T')[0] && t.status !== 'PAGO' ? 'ATRASADO' : t.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-slate-700 uppercase truncate max-w-[220px]">{t.parceiro?.nome || t.descricao}</p>
                {t.pedido_id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/pedidos-compra/${t.pedido_id}`); }}
                    className="flex items-center mt-1 text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-tighter"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Ver Pedido de Compra
                  </button>
                )}
              </td>
              <td className="px-8 py-6">
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest">
                  {t.categoria?.nome || 'DIVERSOS'}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <p className="text-sm font-black text-slate-900">{formatCurrency(t.valor_total)}</p>
              </td>
              <td className="px-8 py-6 text-right">
                <p className={`text-sm font-black ${t.valor_pago > 0 ? 'text-emerald-600' : 'text-slate-400 opacity-40'}`}>
                  {formatCurrency(t.valor_pago)}
                </p>
              </td>
              <td className="px-8 py-6 text-right">
                <p className={`text-sm font-black ${t.valor_total - t.valor_pago > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(t.valor_total - t.valor_pago)}
                </p>
              </td>
              <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end space-x-2">
                  {t.status !== 'PAGO' && (
                    <button
                      onClick={() => onPagar(t)}
                      className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      Pagar
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(t)}
                    className="p-2 text-slate-300 hover:text-indigo-600 rounded-lg transition-colors focus:outline-none"
                    title="Editar Título"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors focus:outline-none">
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
        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-4 text-slate-200">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-slate-900 font-bold text-lg uppercase tracking-tight">Sem contas pendentes</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sua agenda financeira está em dia para este filtro.</p>
      </div>
    );
    return renderTable(list);
  }

  const grouped = items as { [key: string]: ITituloPagar[] };
  const keys = Object.keys(grouped).sort();

  return (
    <div className="divide-y divide-slate-100">
      {keys.map(groupKey => (
        <div key={groupKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-slate-50/80 px-8 py-3 sticky top-0 z-10 backdrop-blur-sm border-y border-slate-100 flex items-center">
            <div className={`w-1.5 h-1.5 rounded-full mr-3 ${groupKey === 'PAGO' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">{groupKey}</h3>
            <span className="ml-auto text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 uppercase">{grouped[groupKey].length} Títulos</span>
          </div>
          {renderTable(grouped[groupKey])}
        </div>
      ))}
    </div>
  );
};

export default PagarList;
