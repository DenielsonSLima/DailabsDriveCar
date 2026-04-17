import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { VersoesService } from '../../cadastros/versoes/versoes.service';
import { IVersao } from '../../cadastros/versoes/versoes.types';
import { MotorizacaoService } from '../../cadastros/motorizacao/motorizacao.service';
import ModalNovaMotorizacao from './ModalNovaMotorizacao';

export interface VersaoPrefillData {
    nome: string;
    motorizacao: string; // sugestão (ex: "1.4")
    combustivel: string;
    ano_fabricacao: number;
    ano_modelo: number;
    fromAPI?: boolean; // indica que veio da consulta de placa
}

interface Props {
    modeloId: string;
    modeloNome?: string;
    onClose: () => void;
    onSuccess: (versao: IVersao) => void;
    prefillData?: VersaoPrefillData;
}

const COMBUSTIVEIS = ['GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'ELÉTRICO', 'HÍBRIDO', 'GNV'];
const TRANSMISSOES = ['MANUAL', 'AUTOMÁTICO', 'CVT', 'SEMI-AUTOMÁTICO', 'AUTOMATIZADO'];

const ModalNovaVersao: React.FC<Props> = ({ modeloId, modeloNome, onClose, onSuccess, prefillData }) => {
    const queryClient = useQueryClient();

    const anoAtual = new Date().getFullYear();

    const [form, setForm] = useState({
        nome: prefillData?.nome || '',
        motorizacao: '',
        combustivel: prefillData?.combustivel || 'FLEX',
        transmissao: '',
        ano_fabricacao: prefillData?.ano_fabricacao || anoAtual,
        ano_modelo: prefillData?.ano_modelo || anoAtual + 1,
    });

    const [showModalMotor, setShowModalMotor] = useState(false);
    const [selectedVersaoId, setSelectedVersaoId] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { data: versoesExistentes = [] } = useQuery({
        queryKey: ['versoes_by_modelo', modeloId],
        queryFn: () => VersoesService.getByModelo(modeloId)
    });

    const { data: motorizacoes = [] } = useQuery({
        queryKey: ['motorizacoes'],
        queryFn: () => MotorizacaoService.getAll()
    });

    // Tentar match automático da motorização sugerida pela API
    const [motorAutoMatched, setMotorAutoMatched] = useState(false);
    React.useEffect(() => {
        if (prefillData?.motorizacao && motorizacoes.length > 0 && !motorAutoMatched) {
            const match = motorizacoes.find(m =>
                m.nome.toUpperCase().includes(prefillData.motorizacao.toUpperCase()) ||
                prefillData.motorizacao.toUpperCase().includes(m.nome.toUpperCase())
            );
            if (match) {
                setForm(prev => ({ ...prev, motorizacao: match.nome }));
            }
            setMotorAutoMatched(true);
        }
    }, [motorizacoes, prefillData, motorAutoMatched]);
    const set = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrorMsg(null);
    };

    const mutation = useMutation({
        mutationFn: () =>
            VersoesService.save({
                modelo_id: modeloId,
                nome: form.nome.toUpperCase(),
                motorizacao: form.motorizacao.toUpperCase(),
                combustivel: form.combustivel,
                transmissao: form.transmissao,
                ano_fabricacao: form.ano_fabricacao,
                ano_modelo: form.ano_modelo,
            }),
        onSuccess: (nova) => {
            queryClient.invalidateQueries({ queryKey: ['versoes_by_modelo', modeloId] });
            onSuccess(nova);
            onClose();
        },
        onError: (err: any) => {
            setErrorMsg(err.message || 'Erro ao cadastrar versão. Tente novamente.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedVersaoId) {
            const v = versoesExistentes.find(x => x.id === selectedVersaoId);
            if (v) {
                onSuccess(v);
                return;
            }
        }

        if (!form.transmissao) {
            setErrorMsg('Selecione a transmissão (câmbio) do veículo!');
            return;
        }
        mutation.mutate();
    };

    const inputCls = "w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all";
    const labelCls = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";

    const isFromAPI = prefillData?.fromAPI;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-6 pb-5 flex items-center justify-between border-b border-slate-100">
                    <div>
                        {isFromAPI && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg mb-1">
                                ⚡ Dados da API Brasil
                            </span>
                        )}
                        <span className="block text-[9px] font-black text-indigo-500 uppercase tracking-widest">Cadastro {isFromAPI ? 'Automático' : 'Rápido'}</span>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nova Versão</h2>
                        {modeloNome && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Modelo: <span className="font-black text-indigo-600">{modeloNome}</span></p>
                        )}
                    </div>
                    <button onClick={onClose} disabled={mutation.isPending} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    {/* Selecionar Existente */}
                    {versoesExistentes.length > 0 && (
                        <div>
                            <label className={labelCls}>Selecionar Versão Existente</label>
                            <select
                                value={selectedVersaoId}
                                onChange={e => setSelectedVersaoId(e.target.value)}
                                className={inputCls + ' appearance-none bg-slate-50 cursor-pointer'}
                            >
                                <option value="">-- Cadastrar Nova Versão --</option>
                                {versoesExistentes.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.nome} {v.motorizacao} {v.combustivel} {v.transmissao} {v.ano_fabricacao}/{v.ano_modelo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedVersaoId && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mt-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-indigo-950 uppercase tracking-tighter">Versão Selecionada</h3>
                                    <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest mt-0.5">Pronta para uso interligado</p>
                                </div>
                            </div>
                            
                            {(() => {
                                const v = versoesExistentes.find(x => x.id === selectedVersaoId);
                                if (!v) return null;
                                return (
                                    <div className="space-y-3 bg-white/60 p-4 rounded-xl">
                                        <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome</span>
                                            <span className="text-xs font-bold text-slate-900">{v.nome}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motorização</span>
                                            <span className="text-xs font-bold text-slate-900">{v.motorizacao} • {v.combustivel}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transmissão</span>
                                            <span className="text-xs font-bold text-slate-900">{v.transmissao}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ano</span>
                                            <span className="text-xs font-bold text-slate-900">{v.ano_fabricacao} / {v.ano_modelo}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {!selectedVersaoId && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            {/* Nome da Versão */}
                            <div>
                                <label className={labelCls}>Nome da Versão / Acabamento *</label>
                                <input
                                    type="text"
                                    value={form.nome}
                                    onChange={e => set('nome', e.target.value.toUpperCase())}
                                    required
                                    disabled={mutation.isPending}
                                    placeholder="Ex: XEI, GLI, SPORT..."
                                    className={inputCls + ' uppercase'}
                                />
                            </div>

                            {/* Motorização */}
                            <div>
                                <label className={labelCls}>Motorização *</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={form.motorizacao}
                                            onChange={e => set('motorizacao', e.target.value)}
                                            required
                                            disabled={mutation.isPending}
                                            className={inputCls + ' appearance-none'}
                                        >
                                            <option value="">Selecione...</option>
                                            {motorizacoes.map(m => (
                                                <option key={m.id} value={m.nome}>{m.nome}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowModalMotor(true)}
                                        className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-all border border-indigo-100 shrink-0"
                                        title="Nova Motorização"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                </div>
                                {isFromAPI && prefillData?.motorizacao && !form.motorizacao && (
                                    <p className="text-[10px] text-amber-600 font-bold mt-1 ml-1">
                                        💡 API sugere motor: {prefillData.motorizacao} — selecione da lista ou cadastre novo
                                    </p>
                                )}
                            </div>

                            {/* Combustível e Transmissão */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Combustível *</label>
                                    <select
                                        value={form.combustivel}
                                        onChange={e => set('combustivel', e.target.value)}
                                        required
                                        disabled={mutation.isPending}
                                        className={inputCls + ' appearance-none'}
                                    >
                                        {COMBUSTIVEIS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`${labelCls} ${isFromAPI && !form.transmissao ? 'text-rose-500 animate-pulse' : ''}`}>
                                        {isFromAPI && !form.transmissao ? '🔴 TRANSMISSÃO * (PREENCHA!)' : 'Transmissão *'}
                                    </label>
                                    <select
                                        value={form.transmissao}
                                        onChange={e => set('transmissao', e.target.value)}
                                        required
                                        disabled={mutation.isPending}
                                        className={`${inputCls} appearance-none ${isFromAPI && !form.transmissao
                                            ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50'
                                            : ''
                                            }`}
                                    >
                                        <option value="">Selecione...</option>
                                        {TRANSMISSOES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Anos */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Ano Fabricação *</label>
                                    <input
                                        type="number"
                                        value={form.ano_fabricacao}
                                        onChange={e => set('ano_fabricacao', Number(e.target.value))}
                                        required
                                        min={1950}
                                        max={anoAtual + 2}
                                        disabled={mutation.isPending}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Ano Modelo *</label>
                                    <input
                                        type="number"
                                        value={form.ano_modelo}
                                        onChange={e => set('ano_modelo', Number(e.target.value))}
                                        required
                                        min={1950}
                                        max={anoAtual + 3}
                                        disabled={mutation.isPending}
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            {/* FIPE Info (se veio da API) */}
                            {isFromAPI && (
                                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mt-2">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Preenchido automaticamente pela API</p>
                                    <p className="text-xs text-emerald-700 font-medium">
                                        Confira os dados acima e preencha apenas a <strong>Transmissão</strong> para concluir.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1 leading-relaxed">
                                {errorMsg.includes('Já existe uma versão') 
                                    ? <span>Esta versão exata já existe no sistema!<br/>👆 Por favor, role para cima e selecione-a no campo <strong>Selecionar Versão Existente</strong>.</span>
                                    : errorMsg}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={mutation.isPending}
                            className="px-6 py-3 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || (!selectedVersaoId && (!form.nome.trim() || !form.motorizacao.trim() || !form.transmissao))}
                            className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {mutation.isPending ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</>
                            ) : (selectedVersaoId ? 'Confirmar Versão' : 'Cadastrar Versão')}
                        </button>
                    </div>
                </form>
            </div>

            {showModalMotor && (
                <ModalNovaMotorizacao
                    onClose={() => setShowModalMotor(false)}
                    onSuccess={(novoMotor) => set('motorizacao', novoMotor.nome)}
                />
            )}
        </div>,
        document.body
    );
};

export default ModalNovaVersao;
