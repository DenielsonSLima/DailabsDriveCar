import React, { useState } from 'react';
import { ITituloPagar } from '../contas-pagar.types';
import { supabase } from '../../../../../lib/supabase';

interface Props {
    titulo: ITituloPagar;
    onClose: () => void;
    onSuccess: () => void;
}

const ModalEditarTitulo: React.FC<Props> = ({ titulo, onClose, onSuccess }) => {
    const [descricao, setDescricao] = useState(titulo.descricao);
    const [dataVencimento, setDataVencimento] = useState(titulo.data_vencimento);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('fin_titulos')
                .update({
                    descricao,
                    data_vencimento: dataVencimento,
                    updated_at: new Date().toISOString()
                })
                .eq('id', titulo.id);

            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            alert('Erro ao salvar alterações: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div data-drivecar-ui className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-900 normal-case tracking-tight">Editar Título</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Descrição</label>
                        <input
                            type="text"
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-[#111827] outline-none focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Data de Vencimento</label>
                        <input
                            type="date"
                            value={dataVencimento}
                            onChange={e => setDataVencimento(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-[#111827] outline-none focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-semibold text-xs normal-case bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">Cancelar</button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-4 bg-indigo-600 text-white font-semibold text-xs normal-case tracking-normal rounded-2xl shadow-sm transition-all active:scale-100 hover:bg-indigo-600"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEditarTitulo;
