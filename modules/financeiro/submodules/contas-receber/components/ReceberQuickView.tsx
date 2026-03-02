import React from 'react';
import { ITituloReceber } from '../contas-receber.types';

interface ReceberQuickViewProps {
    titulo: ITituloReceber;
    isOpen: boolean;
    onClose: () => void;
}

const ReceberQuickView: React.FC<ReceberQuickViewProps> = ({ titulo, isOpen, onClose }) => {
    if (!isOpen) return null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    // Pega a transação mais recente associada a esse título para mostrar os dados da conta
    const ultimaTransacao = titulo.transacoes && titulo.transacoes.length > 0
        ? titulo.transacoes.sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime())[0]
        : null;

    const contaDestino = ultimaTransacao?.conta;

    return (
        <>
            <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Detalhes do Recebimento</h3>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                            Ref: {titulo.documento_ref || 'N/D'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Valor Principal */}
                    <div className="px-6 py-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl text-center shadow-lg shadow-indigo-200">
                        <p className="text-xs font-black text-indigo-100 uppercase tracking-widest mb-2">Valor Total</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter">
                            {formatCurrency(titulo.valor_total)}
                        </h2>
                        <div className="mt-4 flex justify-center">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${titulo.status === 'PAGO' ? 'bg-indigo-400/20 border-indigo-400/30 text-emerald-300' :
                                    'bg-white/20 border-white/30 text-white'
                                }`}>
                                {titulo.status}
                            </span>
                        </div>
                    </div>

                    {/* Dados do Cliente */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dados do Cliente</h4>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Nome/Razão Social</p>
                                <p className="text-sm font-black text-slate-900 uppercase">{titulo.parceiro?.nome || 'Não Informado'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Documento</p>
                                <p className="text-sm font-bold text-slate-700">{titulo.parceiro?.documento || 'N/D'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Recebimento */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Informações do Título</h4>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Data Limite / Venc.</p>
                                <p className="text-sm font-black text-slate-900">{formatDate(titulo.data_vencimento)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Categoria</p>
                                <p className="text-sm font-black text-slate-900 uppercase truncate">
                                    {titulo.categoria?.nome || 'N/D'}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Descrição</p>
                                <p className="text-sm font-bold text-slate-700">{titulo.descricao}</p>
                            </div>
                        </div>
                    </div>

                    {/* Conta de Destino e Liquidação */}
                    {ultimaTransacao && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center">
                                <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                Detalhes da Liquidação
                            </h4>
                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50 space-y-4">

                                <div className="grid grid-cols-2 gap-4 border-b border-emerald-100/50 pb-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Data do Recebimento</p>
                                        <p className="text-sm font-black text-emerald-900">{formatDate(ultimaTransacao.data_pagamento)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Valor Recebido</p>
                                        <p className="text-sm font-black text-emerald-900">{formatCurrency(ultimaTransacao.valor)}</p>
                                    </div>
                                </div>

                                {contaDestino ? (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Conta Bancária de Destino</p>
                                        <div className="flex items-center bg-white p-3 rounded-xl border border-emerald-100">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs mr-3 shrink-0">
                                                {contaDestino.banco_nome?.substring(0, 2).toUpperCase() || 'BK'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-black text-slate-900 truncate uppercase">{contaDestino.nome || contaDestino.banco_nome}</p>
                                                <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                                                    Ag: {contaDestino.agencia || '-'} | CC: {contaDestino.conta || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs font-bold text-emerald-700 italic">Conta bancária não especificada na transação.</p>
                                )}

                            </div>
                        </div>
                    )}

                </div>

            </div>
        </>
    );
};

export default ReceberQuickView;
