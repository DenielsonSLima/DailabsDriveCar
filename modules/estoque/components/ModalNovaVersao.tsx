import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { VersoesService } from '../../cadastros/versoes/versoes.service';
import { IVersao } from '../../cadastros/versoes/versoes.types';
import { MotorizacaoService } from '../../cadastros/motorizacao/motorizacao.service';
import ModalNovaMotorizacao from './ModalNovaMotorizacao';

interface Props {
    modeloId: string;
    modeloNome?: string;
    onClose: () => void;
    onSuccess: (versao: IVersao) => void;
}

const COMBUSTIVEIS = ['GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'ELÉTRICO', 'HÍBRIDO', 'GNV'];
const TRANSMISSOES = ['MANUAL', 'AUTOMÁTICO', 'CVT', 'SEMI-AUTOMÁTICO', 'AUTOMATIZADO'];

const ModalNovaVersao: React.FC<Props> = ({ modeloId, modeloNome, onClose, onSuccess }) => {
    const queryClient = useQueryClient();

    const anoAtual = new Date().getFullYear();

    const [form, setForm] = useState({
        nome: '',
        motorizacao: '',
        combustivel: 'FLEX',
        transmissao: 'MANUAL',
        ano_fabricacao: anoAtual,
        ano_modelo: anoAtual + 1,
    });

    const [showModalMotor, setShowModalMotor] = useState(false);

    const { data: motorizacoes = [] } = useQuery({
        queryKey: ['motorizacoes'],
        queryFn: () => MotorizacaoService.getAll()
    });

    const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

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
            alert('Erro ao cadastrar versão: ' + (err.message || 'Tente novamente.'));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    const inputCls = "w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all";
    const labelCls = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Cadastro Rápido</span>
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

                <form onSubmit={handleSubmit} className="p-8 space-y-4 overflow-y-auto max-h-[70vh]">
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
                            <label className={labelCls}>Transmissão *</label>
                            <select
                                value={form.transmissao}
                                onChange={e => set('transmissao', e.target.value)}
                                required
                                disabled={mutation.isPending}
                                className={inputCls + ' appearance-none'}
                            >
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
                            disabled={mutation.isPending || !form.nome.trim() || !form.motorizacao.trim()}
                            className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {mutation.isPending ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</>
                            ) : 'Cadastrar Versão'}
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
        </div>
    );
};

export default ModalNovaVersao;
