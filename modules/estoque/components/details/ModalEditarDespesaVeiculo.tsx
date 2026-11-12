import React, { useState, useEffect } from 'react';
import { IVeiculoDespesa } from '../../estoque.types';
import { FinanceiroService } from '../../../financeiro/financeiro.service';
import { ICategoriaFinanceira } from '../../../financeiro/financeiro.types';
import { EstoqueService } from '../../estoque.service';

interface Props {
    despesa: IVeiculoDespesa;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalEditarDespesaVeiculo: React.FC<Props> = ({ despesa, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [categorias, setCategorias] = useState<ICategoriaFinanceira[]>([]);

    // Form State
    const [descricao, setDescricao] = useState(despesa.descricao);
    const [dataVencimento, setDataVencimento] = useState(despesa.data_vencimento || '');
    const [valorTotal, setValorTotal] = useState(despesa.valor_total);
    const [categoriaId, setCategoriaId] = useState(despesa.categoria_id);

    useEffect(() => {
        async function load() {
            try {
                const catData = await FinanceiroService.getCategorias();
                setCategorias(catData.filter(c => c.natureza === 'SAIDA' || c.tipo === 'VARIAVEL'));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await EstoqueService.updateExpense(despesa.id!, {
                descricao,
                data_vencimento: dataVencimento || undefined,
                valor_total: valorTotal,
                valor_unitario: valorTotal, // Assuming qty 1 for simple edit
                categoria_id: categoriaId
            });
            onSuccess();
        } catch (err: any) {
            alert('Erro ao atualizar despesa: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div data-drivecar-ui className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="dc-modal  bg-white w-full max-w-lg rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-95 border border-slate-100">

                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="dc-modal-title text-xl font-semibold text-slate-900 normal-case tracking-normal">Editar Despesa</h2>
                        <p className="text-xs text-slate-600 font-bold normal-case tracking-normal mt-1">Ajuste os dados da despesa lançada</p>
                    </div>
                    <button onClick={onClose} className="dc-button p-2 hover:bg-white rounded-full text-slate-600 hover:text-rose-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Descrição</label>
                        <input
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Vencimento</label>
                            <input
                                type="date"
                                value={dataVencimento}
                                onChange={e => setDataVencimento(e.target.value)}
                                className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Categoria</label>
                            <select
                                value={categoriaId}
                                onChange={e => setCategoriaId(e.target.value)}
                                className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                                required
                            >
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Valor Total</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-semibold text-slate-600 text-sm">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={valorTotal}
                                onChange={e => setValorTotal(Number(e.target.value))}
                                className="dc-input w-full bg-slate-900 border-2 border-slate-800 rounded-xl pl-12 pr-5 py-3 text-xl font-semibold text-emerald-400 outline-none focus:border-indigo-500 transition-all shadow-inner"
                                disabled={despesa.status_pagamento === 'PAGO'}
                            />
                        </div>
                        {despesa.status_pagamento === 'PAGO' && (
                            <p className="text-xs text-amber-500 font-bold normal-case mt-2 ml-1">Lançamento quitado. Edição de valor bloqueada.</p>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="dc-button flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-slate-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="dc-button flex-1 py-4 bg-slate-900 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-600 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEditarDespesaVeiculo;
