import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ITituloReceber } from '../contas-receber.types';

interface Props {
  items: ITituloReceber[] | { [key: string]: ITituloReceber[] };
  loading: boolean;
  isGrouped: boolean;
  onBaixa: (titulo: ITituloReceber) => void;
  onDelete: (id: string) => void;
  onRowClick: (titulo: ITituloReceber) => void;
}

const ReceberList: React.FC<Props> = ({ items, loading, isGrouped, onBaixa, onDelete, onRowClick }) => {
  const navigate = useNavigate();
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  if (loading) return (
    <div className="py-32 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando recebíveis...</p>
    </div>
  );

  const getStatusStyle = (status: string, vencimento: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    if (status === 'PAGO') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (vencimento < hoje) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (status === 'PARCIAL') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const renderTable = (rows: ITituloReceber[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-8 py-5">Vencimento</th>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5">Cliente / Documento</th>
            <th className="px-8 py-5">Categoria</th>
            <th className="px-8 py-5">Conta de Destino</th>
            <th className="px-8 py-5 text-right">Valor Total</th>
            <th className="px-8 py-5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((t) => (
            <tr key={t.id} onClick={() => onRowClick(t)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
              <td className="px-8 py-6">
                <p className="text-xs font-black text-slate-900">{formatDate(t.data_vencimento)}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Ref: {t.documento_ref || 'N/D'}</p>
              </td>
              <td className="px-8 py-6">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(t.status, t.data_vencimento)}`}>
                  {t.data_vencimento < new Date().toISOString().split('T')[0] && t.status !== 'PAGO' ? 'VENCIDO' : t.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <p className="text-xs font-bold text-slate-700 uppercase truncate max-w-[220px]">{t.parceiro?.nome || t.descricao}</p>
                {t.pedido_id && (
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/pedidos-venda/${t.pedido_id}`); }} className="flex items-center mt-1 text-[9px] font-black text-emerald-500 hover:text-emerald-700 uppercase tracking-tighter">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Ver Pedido de Venda
                  </button>
                )}
              </td>
              <td className="px-8 py-6">
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest truncate max-w-[150px] inline-block">
                  {t.categoria?.nome || 'RECEITA'}
                </span>
              </td>
              <td className="px-8 py-6">
                {t.transacoes && t.transacoes.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest w-fit truncate max-w-[150px]">
                      {t.transacoes[0].conta?.nome || t.transacoes[0].conta?.banco_nome || 'CONTA'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {t.transacoes[0].conta?.agencia || '-'} / {t.transacoes[0].conta?.conta || '-'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-300 italic">Pendente</span>
                )}
              </td>
              <td className="px-8 py-6 text-right">
                <p className="text-sm font-black text-slate-900">{formatCurrency(t.valor_total)}</p>
                {t.valor_pago > 0 && t.status !== 'PAGO' && (
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">Entrou: {formatCurrency(t.valor_pago)}</p>
                )}
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                  {t.status !== 'PAGO' && (
                    <button onClick={() => onBaixa(t)} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                      Baixar
                    </button>
                  )}
                  <button onClick={() => onDelete(t.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors">
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
    const list = items as ITituloReceber[];
    if (list.length === 0) return <div className="py-32 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum título a receber encontrado</div>;
    return renderTable(list);
  }

  const grouped = items as { [key: string]: ITituloReceber[] };
  const keys = Object.keys(grouped).sort();

  return (
    <div className="divide-y divide-slate-100">
      {keys.map(groupKey => (
        <div key={groupKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-slate-50/80 px-8 py-3 sticky top-0 z-10 backdrop-blur-sm border-y border-slate-100 flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3"></div>
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">{groupKey}</h3>
            <span className="ml-auto text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 uppercase">{grouped[groupKey].length} Títulos</span>
          </div>
          {renderTable(grouped[groupKey])}
        </div>
      ))}
    </div>
  );
};

export default ReceberList;
