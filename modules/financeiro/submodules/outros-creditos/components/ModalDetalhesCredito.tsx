import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OutrosCreditosService } from '../outros-creditos.service';
import { TitulosService } from '../../../services/titulos.service';
import ModalBaixa from '../../components/ModalBaixa';
import { ITituloCredito } from '../outros-creditos.types';
import { SociosService } from '../../../../ajustes/socios/socios.service';
import { ISocio } from '../../../../ajustes/socios/socios.types';

interface Props {
    titulo: ITituloCredito;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalDetalhesCredito: React.FC<Props> = ({ titulo, onClose, onSuccess }) => {
    const queryClient = useQueryClient();
    const [recebimentos, setRecebimentos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showBaixa, setShowBaixa] = useState(false);
    const [sociosList, setSociosList] = useState<ISocio[]>([]);

    // Estados para edição
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [novoValor, setNovoValor] = useState<number>(0);
    const [novaData, setNovaData] = useState<string>('');

    useEffect(() => {
        async function load() {
            try {
                const [data, sData] = await Promise.all([
                    OutrosCreditosService.getRecebimentos(titulo.id),
                    SociosService.getAll()
                ]);
                setRecebimentos(data || []);
                setSociosList(sData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [titulo.id, refreshKey]);

    const getSocioNome = (id: string, fallback: string) => {
        const s = sociosList.find(item => item.id === id);
        return s?.nome || fallback;
    };

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const formatDate = (date: string) => {
        if (!date) return '---';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const handleDeleteReceipt = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja estornar este recebimento? O saldo do título será recalculado.')) return;

        try {
            await TitulosService.excluirPagamento(id, titulo.id);
            setRefreshKey(prev => prev + 1);
            onSuccess(); // Triggers reload on parent
            queryClient.invalidateQueries({ queryKey: ['fin_outros_creditos_sync'] });
        } catch (err) {
            console.error('Erro ao excluir recebimento:', err);
            alert('Erro ao excluir recebimento.');
        }
    };

    const handleStartEdit = (r: any) => {
        setEditandoId(r.id);
        setNovoValor(r.valor);
        setNovaData(new Date(r.data_pagamento).toISOString().split('T')[0]);
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
            onSuccess(); // Triggers reload on parent
            queryClient.invalidateQueries({ queryKey: ['fin_outros_creditos_sync'] });
        } catch (err) {
            console.error('Erro ao editar recebimento:', err);
            alert('Erro ao salvar alterações.');
        }
    };

    const valorRecebidoTotal = recebimentos.reduce((acc, r) => acc + Number(r.valor), 0);
    const valorPendente = Math.max(0, titulo.valor_total - valorRecebidoTotal);

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">

                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Detalhes do Crédito</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-2"></span>
                                Ref: {titulo.documento_ref || 'N/D'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-600 active:scale-95 group">
                        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-10 space-y-10">
                    {/* Resumo de Valores */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                            <p className="text-lg font-black text-slate-900">{fmt(titulo.valor_total)}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valor Recebido</p>
                            <p className="text-lg font-black text-emerald-700">
                                {fmt(valorRecebidoTotal)}
                            </p>
                        </div>
                        <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100">
                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Em Aberto</p>
                            <p className="text-lg font-black text-rose-700">
                                {fmt(valorPendente)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição / Origem</p>
                            <p className="text-sm font-bold text-slate-800 uppercase">{titulo.descricao}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vencimento</p>
                            <p className="text-sm font-bold text-slate-700">{formatDate(titulo.data_vencimento)}</p>
                        </div>
                    </div>

                    {/* Divisão entre Sócios */}
                    {titulo.socios && titulo.socios.length > 0 && (
                        <div className="bg-indigo-50/30 p-6 rounded-[2rem] border border-indigo-100">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-5 flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                Divisão entre Sócios
                            </h4>
                            <div className="space-y-3">
                                {titulo.socios.map((s, idx) => {
                                    const nomeSocio = getSocioNome(s.socio_id, s.socio?.nome || 'Sócio');
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-white p-5 rounded-2xl border border-indigo-50 shadow-sm hover:border-indigo-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner">
                                                    <span className="text-xs font-black text-indigo-600">{(nomeSocio[0] || 'S').toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{nomeSocio}</p>
                                                    <div className="flex items-center mt-0.5">
                                                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded-md">{s.porcentagem.toFixed(1)}%</span>
                                                        <span className="mx-2 text-slate-200 text-xs">|</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Participação</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">{fmt(s.valor)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <hr className="border-slate-100" />

                    {/* Histórico de Recebimentos */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Histórico de Recebimentos / Baixas
                        </h4>

                        {valorPendente > 0 && (
                            <button
                                onClick={() => setShowBaixa(true)}
                                className="mb-4 w-full py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Adicionar Novo Recebimento
                            </button>
                        )}

                        {loading ? (
                            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : recebimentos.length === 0 ? (
                            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nenhum recebimento registrado ainda</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recebimentos.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-teal-100 transition-all">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-teal-500">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                            </div>
                                            {editandoId === r.id ? (
                                                <div className="flex flex-col space-y-2">
                                                    <input
                                                        type="date"
                                                        value={novaData}
                                                        onChange={(e) => setNovaData(e.target.value)}
                                                        className="text-[10px] bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-700"
                                                    />
                                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{r.conta?.banco_nome || 'Conta Direta'}</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{r.conta?.banco_nome || 'Conta Direta'}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Recebido em: {formatDate(r.data_pagamento)} • {r.forma?.nome || 'Direto'}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            {editandoId === r.id ? (
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
                                                    <p className="text-sm font-black text-emerald-600">{fmt(r.valor)}</p>
                                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => handleStartEdit(r)}
                                                            className="p-2 text-teal-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                                            title="Editar Recebimento"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReceipt(r.id)}
                                                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Estornar Recebimento"
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

            {showBaixa && (
                <ModalBaixa
                    titulo={titulo as any}
                    onClose={() => setShowBaixa(false)}
                    onSuccess={() => {
                        setShowBaixa(false);
                        setRefreshKey(prev => prev + 1);
                        onSuccess();
                    }}
                />
            )}
        </div>
    );
};

export default ModalDetalhesCredito;
