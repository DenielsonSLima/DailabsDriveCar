import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ContasPagarService } from '../contas-pagar.service';
import { TitulosService } from '../../../services/titulos.service';

interface Props {
    titulo: any;
    onClose: () => void;
}

const ModalDetalhesTitulo: React.FC<Props> = ({ titulo, onClose }) => {
    const queryClient = useQueryClient();
    const [pagamentos, setPagamentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Estados para edição
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [novoValor, setNovoValor] = useState<number>(0);
    const [novaData, setNovaData] = useState<string>('');

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
    }, [titulo.id, refreshKey]);

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const formatDate = (date: string) => {
        if (!date) return '---';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const handleDeletePayment = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja estornar este pagamento? O saldo do título será recalculado.')) return;

        try {
            await TitulosService.excluirPagamento(id, titulo.id);
            setRefreshKey(prev => prev + 1);
            queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
            queryClient.invalidateQueries({ queryKey: ['caixa-transacoes'] });
        } catch (err) {
            console.error('Erro ao excluir pagamento:', err);
            alert('Erro ao excluir pagamento. Verifique os logs.');
        }
    };

    const handleStartEdit = (p: any) => {
        setEditandoId(p.id);
        setNovoValor(p.valor);
        setNovaData(new Date(p.data_pagamento).toISOString().split('T')[0]);
    };

    const handleSaveEdit = async () => {
        if (!editandoId) return;
        try {
            await TitulosService.editarPagamento(editandoId, titulo.id, {
                valor: novoValor,
                data_pagamento: novaData
            });
            setEditandoId(null);
            setRefreshKey(prev => prev + 1);
            queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
            queryClient.invalidateQueries({ queryKey: ['caixa-transacoes'] });
        } catch (err) {
            console.error('Erro ao editar pagamento:', err);
            alert('Erro ao salvar alterações.');
        }
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
                    {/* Resumo de Valores */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                            <p className="text-lg font-black text-slate-900">{fmt(titulo.valor_total)}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valor Pago</p>
                            <p className="text-lg font-black text-emerald-700">
                                {fmt(pagamentos.reduce((acc, p) => acc + Number(p.valor), 0))}
                            </p>
                        </div>
                        <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100">
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Valor em Aberto</p>
                            <p className="text-lg font-black text-rose-700">
                                {fmt(Math.max(0, titulo.valor_total + (titulo.valor_acrescimo || 0) - pagamentos.reduce((acc, p) => acc + Number(p.valor), 0) - (titulo.valor_desconto || 0)))}
                            </p>
                        </div>
                    </div>

                    {(titulo.valor_desconto > 0 || titulo.valor_acrescimo > 0) && (
                        <div className="grid grid-cols-2 gap-3">
                            {titulo.valor_desconto > 0 && (
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descontos Aplicados</p>
                                    <p className="text-sm font-black text-emerald-600">-{fmt(titulo.valor_desconto)}</p>
                                </div>
                            )}
                            {titulo.valor_acrescimo > 0 && (
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Acréscimos (Juros)</p>
                                    <p className="text-sm font-black text-rose-600">+{fmt(titulo.valor_acrescimo)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição / Favorecido</p>
                            <p className="text-sm font-bold text-slate-800 uppercase">{titulo.parceiro?.nome || titulo.descricao}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vencimento</p>
                            <p className="text-sm font-bold text-slate-700">{formatDate(titulo.data_vencimento)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Referência</p>
                            <p className="text-xs font-bold text-slate-500 uppercase">{titulo.documento_ref || 'NENHUMA'}</p>
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
                                            {editandoId === p.id ? (
                                                <div className="flex flex-col space-y-2">
                                                    <input
                                                        type="date"
                                                        value={novaData}
                                                        onChange={(e) => setNovaData(e.target.value)}
                                                        className="text-[10px] bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-700"
                                                    />
                                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{p.conta?.banco_nome || 'Conta Direta'}</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        {p.tipo_transacao === 'DESCONTO_TITULO' ? (
                                                            <span className="text-emerald-500">%</span>
                                                        ) : p.tipo_transacao === 'ACRESCIMO_TITULO' ? (
                                                            <span className="text-amber-500">+</span>
                                                        ) : (
                                                            <span className="text-red-500">$</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {p.tipo_transacao === 'DESCONTO_TITULO'
                                                                    ? 'Desconto Obtido'
                                                                    : p.tipo_transacao === 'ACRESCIMO_TITULO'
                                                                        ? 'Acréscimo Pago'
                                                                        : 'Pagamento Realizado'}
                                                            </p>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${p.tipo_transacao === 'DESCONTO_TITULO'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : p.tipo_transacao === 'ACRESCIMO_TITULO'
                                                                        ? 'bg-amber-100 text-amber-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {p.tipo_transacao === 'DESCONTO_TITULO'
                                                                    ? 'Desconto'
                                                                    : p.tipo_transacao === 'ACRESCIMO_TITULO'
                                                                        ? 'Juros'
                                                                        : 'Baixa'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            {new Date(p.data_pagamento).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            {editandoId === p.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        value={novoValor}
                                                        onChange={(e) => setNovoValor(Number(e.target.value))}
                                                        className="w-24 text-right bg-white border border-slate-200 rounded px-2 py-1 text-sm font-black text-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                    <button onClick={handleSaveEdit} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    </button>
                                                    <button onClick={() => setEditandoId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-black text-emerald-600">{fmt(p.valor)}</p>
                                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => handleStartEdit(p)}
                                                            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Editar Pagamento"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(p.id)}
                                                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Estornar Pagamento"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
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
