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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Editar Título</h3>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Descrição</label>
                        <input
                            type="text"
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-[#111827] outline-none focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Data de Vencimento</label>
                        <input
                            type="date"
                            value={dataVencimento}
                            onChange={e => setDataVencimento(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-[#111827] outline-none focus:border-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">Cancelar</button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 hover:bg-indigo-600"
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
