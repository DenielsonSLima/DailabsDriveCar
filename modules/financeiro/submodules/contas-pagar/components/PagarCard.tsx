import React from 'react';
import { ITituloPagar } from '../contas-pagar.types';

interface Props {
    titulo: ITituloPagar;
    onOpenDetails: (titulo: ITituloPagar) => void;
    onDelete: (id: string) => void;
}

const PagarCard: React.FC<Props> = ({ titulo, onOpenDetails, onDelete }) => {
    const fmt = (v: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const isPago = titulo.status === 'PAGO';
    const isVencido = !isPago && new Date(titulo.data_vencimento) < new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <div
            onClick={() => onOpenDetails(titulo)}
            className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

            {/* Header: Status & Vencimento */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isPago
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : isVencido
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}
                >
                    {isPago ? 'Pago' : isVencido ? 'Vencido' : 'Pendente'}
                </span>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencimento</p>
                    <p className={`text-xs font-bold ${isVencido ? 'text-rose-600' : 'text-slate-600'}`}>
                        {new Date(titulo.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                </div>
            </div>

            {/* Vehicle Info Section - Dark Theme Alignment */}
            <div className="mb-4">
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
                ) : titulo.origem_tipo === 'PEDIDO_COMPRA' || titulo.origem_tipo === 'DESPESA_VEICULO' ? (
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
            </div>

            {/* Favorecido & Ref */}
            <div className="mb-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Favorecido / Descrição</p>
                <p className="text-sm font-bold text-slate-800 line-clamp-1 uppercase">
                    {titulo.parceiro?.nome || titulo.descricao}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Ref: {titulo.documento_ref || 'N/D'}</p>
            </div>

            {/* Footer: Valores */}
            <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor do Título</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-xl font-black text-slate-900 leading-none">{fmt(titulo.valor_total)}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetails(titulo);
                        }}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                        title="Ver Detalhes"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>

                    {!isPago && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(titulo.id);
                            }}
                            className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all active:scale-95"
                            title="Excluir"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PagarCard;
