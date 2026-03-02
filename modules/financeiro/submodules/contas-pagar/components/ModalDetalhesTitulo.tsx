import React, { useEffect, useState } from 'react';
import { ITituloPagar } from '../contas-pagar.types';
import { ContasPagarService } from '../contas-pagar.service';

interface Props {
    titulo: ITituloPagar;
    onClose: () => void;
}

const ModalDetalhesTitulo: React.FC<Props> = ({ titulo, onClose }) => {
    const [pagamentos, setPagamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await ContasPagarService.getPagamentos(titulo.id);
                setPagamentos(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [titulo.id]);

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const formatDate = (date: string) => {
        if (!date) return '---';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Detalhes do Título</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ref: {titulo.documento_ref || 'N/D'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Informações Básicas */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição / Favorecido</p>
                            <p className="text-sm font-bold text-slate-800 uppercase">{titulo.parceiro?.nome || titulo.descricao}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                            <p className="text-xl font-black text-slate-900">{fmt(titulo.valor_total)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vencimento</p>
                            <p className="text-sm font-bold text-slate-700">{formatDate(titulo.data_vencimento)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Atual</p>
                            <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${titulo.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                {titulo.status}
                            </span>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Histórico de Pagamentos */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Histórico de Pagamentos / Baixas
                        </h4>

                        {loading ? (
                            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : pagamentos.length === 0 ? (
                            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nenhum pagamento registrado ainda</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pagamentos.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-indigo-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{p.conta?.banco_nome || 'Conta Direta'}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Pago em: {formatDate(p.data_pagamento)} • {p.forma?.nome || 'Direto'}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-emerald-600">{fmt(p.valor)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        Fechar Visualização
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalhesTitulo;
