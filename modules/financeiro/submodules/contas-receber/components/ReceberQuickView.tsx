import React, { useState } from 'react';
import { ITituloReceber } from '../contas-receber.types';
import { useQueryClient } from '@tanstack/react-query';
import { TitulosService } from '../../../services/titulos.service';

interface ReceberQuickViewProps {
    titulo: ITituloReceber;
    isOpen: boolean;
    onClose: () => void;
}

const ReceberQuickView: React.FC<ReceberQuickViewProps> = ({ titulo, isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [refreshKey, setRefreshKey] = useState(0);

    // Estados para edição
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [novoValor, setNovoValor] = useState<number>(0);
    const [novaData, setNovaData] = useState<string>('');

    if (!isOpen) return null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    // Mapeia todas as transações para visualização em lista
    const transacoes = titulo.transacoes || [];
    const valorPagoTotal = transacoes.reduce((acc, t) => acc + Number(t.valor), 0);

    const handleDeletePayment = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja estornar este recebimento? O saldo do título será recalculado.')) return;

        try {
            await TitulosService.excluirPagamento(id, titulo.id);
            queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
            queryClient.invalidateQueries({ queryKey: ['caixa-transacoes'] });
            onClose();
        } catch (err) {
            console.error('Erro ao excluir recebimento:', err);
            alert('Erro ao excluir recebimento.');
        }
    };

    const handleStartEdit = (t: any) => {
        setEditandoId(t.id);
        setNovoValor(t.valor);
        setNovaData(new Date(t.data_pagamento).toISOString().split('T')[0]);
    };

    const handleSaveEdit = async () => {
        if (!editandoId) return;
        try {
            await TitulosService.editarPagamento(editandoId, titulo.id, {
                valor: novoValor,
                data_pagamento: novaData
            });
            setEditandoId(null);
            queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
            queryClient.invalidateQueries({ queryKey: ['caixa-transacoes'] });
            onClose(); // Fecha para forçar refresh do pai já que é via props
        } catch (err) {
            console.error('Erro ao editar recebimento:', err);
            alert('Erro ao editar recebimento.');
        }
    };

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

                    {/* Valor Principal e Resumo */}
                    <div className="space-y-4">
                        <div className="px-6 py-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl text-center shadow-lg shadow-emerald-200">
                            <p className="text-xs font-black text-emerald-100 uppercase tracking-widest mb-2">Valor Total</p>
                            <h2 className="text-4xl font-black text-white tracking-tighter">
                                {formatCurrency(titulo.valor_total)}
                            </h2>
                            <div className="mt-4 flex justify-center">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${titulo.status === 'PAGO' ? 'bg-emerald-400/20 border-white/30 text-white' :
                                    'bg-white/20 border-white/30 text-white'
                                    }`}>
                                    {titulo.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Já Recebido</p>
                                <p className="text-lg font-black text-emerald-700">{formatCurrency(valorPagoTotal)}</p>
                            </div>
                            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Saldo em Aberto</p>
                                <p className="text-lg font-black text-rose-700">{formatCurrency(Math.max(0, titulo.valor_total - valorPagoTotal))}</p>
                            </div>
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

                    {/* Histórico de Liquidações */}
                    <div>
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center">
                            <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Histórico de Recebimentos
                        </h4>

                        <div className="space-y-3">
                            {transacoes.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Nenhum recebimento registrado.</p>
                            ) : (
                                transacoes.map((t) => (
                                    <div key={t.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 group hover:border-emerald-200 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            {editandoId === t.id ? (
                                                <div className="flex flex-col space-y-2">
                                                    <input
                                                        type="date"
                                                        value={novaData}
                                                        onChange={(e) => setNovaData(e.target.value)}
                                                        className="text-[10px] bg-white border border-emerald-200 rounded px-2 py-1 font-bold text-emerald-700"
                                                    />
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            value={novoValor}
                                                            onChange={(e) => setNovoValor(Number(e.target.value))}
                                                            className="w-24 text-right bg-white border border-emerald-200 rounded px-2 py-1 text-sm font-black text-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        />
                                                        <button onClick={handleSaveEdit} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                        </button>
                                                        <button onClick={() => setEditandoId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-[10px] font-bold text-emerald-700 uppercase">{formatDate(t.data_pagamento)}</p>
                                                    <p className="text-sm font-black text-emerald-900">{formatCurrency(t.valor)}</p>
                                                </div>
                                            )}
                                            {editandoId !== t.id && (
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => handleStartEdit(t)}
                                                        className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Editar Recebimento"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(t.id)}
                                                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Estornar Recebimento"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {t.conta && (
                                            <div className="flex items-center mt-2 pt-2 border-t border-emerald-100/30">
                                                <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[8px] mr-2 shrink-0 uppercase">
                                                    MB
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-500 truncate uppercase">
                                                    {t.conta.banco_nome || t.conta.titular} | Ag: {t.conta.agencia || '-'} CC: {t.conta.conta || '-'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                    >
                        Fechar Visualização
                    </button>
                </div>

            </div>
        </>
    );
};

export default ReceberQuickView;
