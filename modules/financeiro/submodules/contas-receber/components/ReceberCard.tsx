import React from 'react';
import { ITituloReceber } from '../contas-receber.types';

interface ReceberCardProps {
    titulo: ITituloReceber;
    onBaixa: (titulo: ITituloReceber) => void;
    onDelete: (id: string) => void;
    onClick: (titulo: ITituloReceber) => void;
}

const ReceberCard: React.FC<ReceberCardProps> = ({ titulo, onBaixa, onDelete, onClick }) => {
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    const getStatusStyle = (status: string, vencimento: string) => {
        const hoje = new Date().toISOString().split('T')[0];
        if (status === 'PAGO') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (vencimento < hoje) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (status === 'PARCIAL') return 'bg-blue-50 text-blue-600 border-blue-100';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };

    const valorPendente = titulo.valor_total + (titulo.valor_acrescimo || 0) - titulo.valor_pago - (titulo.valor_desconto || 0);
    const isVencido = titulo.data_vencimento < new Date().toISOString().split('T')[0] && titulo.status !== 'PAGO';

    return (
        <div
            onClick={() => onClick(titulo)}
            className="group bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer flex flex-col h-full active:scale-[0.98]"
        >
            {/* Header: Status and Date */}
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(titulo.status, titulo.data_vencimento)}`}>
                        {isVencido ? 'VENCIDO' : titulo.status}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block pt-1">
                        Venc: <span className="text-slate-900">{formatDate(titulo.data_vencimento)}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Ref: {titulo.documento_ref || 'N/D'}</p>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest mt-1 inline-block">
                        {titulo.categoria?.nome || 'RECEITA'}
                    </span>
                </div>
            </div>

            {/* Main Info: Vehicle and Partner */}
            <div className="flex-1 space-y-4">
                {/* Vehicle Info - Highlithed for quick identification */}
                {titulo.veiculo ? (
                    <div className="bg-slate-900 rounded-2xl p-4 shadow-lg relative overflow-hidden group-hover:bg-indigo-950 transition-colors">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <p className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">Veículo</p>
                                <h4 className="text-white font-black text-sm uppercase truncate max-w-[140px]">
                                    {titulo.veiculo.montadora?.nome} {titulo.veiculo.modelo?.nome}
                                </h4>
                            </div>
                            <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
                                <p className="text-white font-black text-[11px] tracking-widest uppercase">{titulo.veiculo.placa}</p>
                            </div>
                        </div>
                    </div>
                ) : titulo.origem_tipo === 'OUTRO_CREDITO' ? (
                    <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mb-0.5">Veículo (Ref. Descrição)</p>
                        <h4 className="text-slate-900 font-black text-sm uppercase truncate">
                            {titulo.descricao}
                        </h4>
                    </div>
                ) : (
                    <div className="h-14 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">Sem veículo vinculado</p>
                    </div>
                )}

                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Cliente</p>
                    <h3 className="text-sm font-black text-slate-900 uppercase truncate leading-tight">
                        {titulo.parceiro?.nome || titulo.descricao}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {titulo.parceiro?.documento || 'Doc não informado'}
                    </p>
                </div>
            </div>

            {/* Values */}
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Valor Total</p>
                    <p className="text-lg font-black text-slate-900 tracking-tighter">{formatCurrency(titulo.valor_total)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Pendente</p>
                    <p className={`text-lg font-black tracking-tighter ${valorPendente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(valorPendente)}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {titulo.status !== 'PAGO' && (
                    <button
                        onClick={() => onBaixa(titulo)}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                    >
                        Baixar Título
                    </button>
                )}
                <button
                    onClick={() => onDelete(titulo.id)}
                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ReceberCard;
