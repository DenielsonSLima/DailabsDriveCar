import React from 'react';
import { ITituloVariavel } from '../despesas-variaveis.types';

interface Props {
  items: ITituloVariavel[] | { [key: string]: ITituloVariavel[] };
  loading: boolean;
  isGrouped: boolean;
  onPagar: (titulo: ITituloVariavel) => void;
  onEdit: (titulo: ITituloVariavel) => void;
  onDelete: (id: string) => void;
}

const VariaveisList: React.FC<Props> = ({ items, loading, isGrouped, onPagar, onEdit, onDelete }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando despesas operacionais...</p>
    </div>
  );

  const renderTable = (rows: ITituloVariavel[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-5">Vencimento</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5">Fornecedor / Descrição</th>
            <th className="px-8 py-5">Categoria</th>
            <th className="px-8 py-5 text-right w-32">Lançado</th>
            <th className="px-8 py-5 text-right w-32">Aberto</th>
            <th className="px-8 py-5 text-right w-20">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-8 py-6">
                <p className="text-xs font-black text-slate-900">{formatDate(t.data_vencimento)}</p>
              </td>
              <td className="px-8 py-6">
                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${t.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                  {t.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-slate-700 uppercase truncate max-w-[200px]">{t.descricao}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{t.parceiro?.nome || 'Fornecedor Avulso'}</p>
              </td>
              <td className="px-8 py-6">
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                  {t.categoria?.nome}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <p className="text-sm font-black text-slate-900">{formatCurrency(t.valor_total)}</p>
              </td>
              <td className="px-8 py-6 text-right">
                <p className="text-sm font-black text-rose-600">{formatCurrency(Math.max(0, t.valor_total - (t.valor_pago || 0)))}</p>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex justify-end space-x-2">
                  {t.status !== 'PAGO' && (
                    <button onClick={() => onPagar(t)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Baixar">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  )}
                  <button onClick={() => onEdit(t)} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Editar">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
    const list = items as ITituloVariavel[];
    if (list.length === 0) return <div className="py-32 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma despesa encontrada</div>;
    return renderTable(list);
  }

  const grouped = items as { [key: string]: ITituloVariavel[] };
  const keys = Object.keys(grouped).sort();

  return (
    <div className="divide-y divide-slate-100">
      {keys.map(groupKey => (
        <div key={groupKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-slate-50/80 px-8 py-3 sticky top-0 z-10 backdrop-blur-sm border-y border-slate-100 flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-3"></div>
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">{groupKey}</h3>
            <span className="ml-auto text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 uppercase">{grouped[groupKey].length} Notas</span>
          </div>
          {renderTable(grouped[groupKey])}
        </div>
      ))}
    </div>
  );
};

export default VariaveisList;
