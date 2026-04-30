import React from 'react';
import { ITituloDebito } from '../outros-debitos.types';

interface Props {
    titulo: ITituloDebito;
    onPagar: (titulo: ITituloDebito) => void;
    onEdit: (titulo: ITituloDebito) => void;
    onDelete: (id: string) => void;
    onBaixa: (titulo: ITituloDebito) => void;
}

const DebitoCard: React.FC<Props> = ({ titulo, onPagar, onEdit, onDelete, onBaixa }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');

    const valorPendente = titulo.valor_pendente || 0;
    const valorLiquidado = titulo.valor_liquidado || 0;
    const porcentagem = Math.min(100, Math.round((valorLiquidado / (titulo.valor_total || 1)) * 100));
    const isPago = titulo.status === 'PAGO';

    return (
        <div
            onClick={() => onPagar(titulo)}
            className="group bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-2xl hover:border-rose-300 transition-all duration-500 cursor-pointer flex flex-col h-full animate-in fade-in"
        >
            <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${isPago ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                    {titulo.status}
                </span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {titulo.status !== 'PAGO' && (
                        <button
                            onClick={() => onBaixa(titulo)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Pagar / Baixar"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    )}
                    <button onClick={() => onEdit(titulo)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => onDelete(titulo.id)} className="p-2 text-slate-300 hover:text-rose-600 rounded-lg transition-colors" title="Excluir">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            <div className="mb-4 min-w-0">
                <h4 className="text-xs font-black text-slate-800 uppercase truncate leading-tight group-hover:text-rose-700 transition-colors">
                    {titulo.descricao || 'Sem Descrição'}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {titulo.parceiro?.nome || titulo.categoria?.nome || 'Diversos'}
                </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-slate-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Vencimento</p>
                            <p className="text-[10px] font-black text-slate-700 leading-none">{formatDate(titulo.data_vencimento)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Conta</p>
                        <p className="text-[10px] font-black text-slate-700 leading-none truncate max-w-[100px]">
                            {titulo.transacoes?.[0]?.conta_origem?.banco_nome || 'A DEFINIR'}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200/50">
                    <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Total</p>
                        <p className="text-sm font-black text-slate-900 leading-none">{formatCurrency(titulo.valor_total)}</p>
                    </div>

                    <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Pago</p>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{formatCurrency(valorLiquidado)}</span>
                    </div>

                    <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Pendente</p>
                        <p className="text-[11px] font-black text-rose-600 leading-none">{formatCurrency(valorPendente)}</p>
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <div className={`w-full h-1.5 rounded-full overflow-hidden bg-slate-100 mb-2`}>
                    <div
                        className={`h-full transition-all duration-1000 ${isPago ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${porcentagem}%` }}
                    />
                </div>
                <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                    <span className="text-slate-400">Progresso</span>
                    <span className={isPago ? 'text-emerald-600' : 'text-rose-600'}>
                        {porcentagem}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DebitoCard;
