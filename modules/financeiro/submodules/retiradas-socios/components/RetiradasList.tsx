
import React from 'react';
import { IRetirada } from '../retiradas.types';

interface Props {
  items: IRetirada[] | { [key: string]: IRetirada[] };
  loading: boolean;
  isGrouped: boolean;
  onEdit: (retirada: IRetirada) => void;
  onDelete: (id: string) => void;
}

const RetiradasList: React.FC<Props> = ({ items, loading, isGrouped, onEdit, onDelete }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando retiradas...</p>
    </div>
  );

  const renderTable = (rows: IRetirada[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-5">Data</th>
            <th className="px-8 py-5">Sócio / Beneficiário</th>
            <th className="px-8 py-5">Classificação</th>
            <th className="px-8 py-5">Conta de Saída</th>
            <th className="px-8 py-5 text-right">Valor</th>
            <th className="px-8 py-5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-8 py-6 text-xs font-bold text-slate-900">{formatDate(r.data)}</td>
              <td className="px-8 py-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px] shadow-lg uppercase">{r.socio?.nome?.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{r.socio?.nome}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{r.descricao}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${r.tipo === 'DISTRIBUICAO_LUCRO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                  {r.tipo.replace('_', ' ')}
                </span>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-black text-slate-600 uppercase tracking-tighter">{r.conta_origem?.banco_nome}</p>
                <p className="text-[9px] text-slate-400 font-mono">CC: {r.conta_origem?.conta || '---'}</p>
              </td>
              <td className="px-8 py-6 text-right">
                <p className="text-base font-black text-rose-600">{formatCurrency(r.valor)}</p>
              </td>
              <td className="px-8 py-6 text-right flex justify-end space-x-2">
                <button onClick={() => onEdit(r)} className="p-2 text-slate-300 hover:text-amber-600 transition-colors" title="Editar Retirada">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onDelete(r.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors" title="Estornar Retirada">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!isGrouped) {
    const list = items as IRetirada[];
    if (list.length === 0) return <div className="py-32 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">Sem lançamentos registrados</div>;
    return renderTable(list);
  }

  const grouped = items as { [key: string]: IRetirada[] };
  const keys = Object.keys(grouped).sort();

  return (
    <div className="divide-y divide-slate-100">
      {keys.map(groupKey => (
        <div key={groupKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-slate-50/80 px-8 py-3 sticky top-0 z-10 backdrop-blur-sm border-y border-slate-100 flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3"></div>
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">{groupKey}</h3>
            <span className="ml-auto text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 uppercase">{grouped[groupKey].length} Lançamentos</span>
          </div>
          {renderTable(grouped[groupKey])}
        </div>
      ))}
    </div>
  );
};

export default RetiradasList;
