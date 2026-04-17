import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MotorizacaoService } from '../../cadastros/motorizacao/motorizacao.service';
import { IMotorizacao } from '../../cadastros/motorizacao/motorizacao.types';

interface Props {
    onClose: () => void;
    onSuccess: (motor: IMotorizacao) => void;
}

const ModalNovaMotorizacao: React.FC<Props> = ({ onClose, onSuccess }) => {
    const queryClient = useQueryClient();
    const [nome, setNome] = useState('');

    const mutation = useMutation({
        mutationFn: () => MotorizacaoService.save({ nome: nome.toUpperCase() }),
        onSuccess: (novo) => {
            queryClient.invalidateQueries({ queryKey: ['motorizacoes'] });
            onSuccess(novo);
            onClose();
        },
        onError: (err: any) => {
            alert('Erro ao cadastrar motorização: ' + (err.message || 'Tente novamente.'));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) return;
        mutation.mutate();
    };

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Cadastro Rápido</span>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Nova Motorização</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome/Cilindrada *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={e => setNome(e.target.value.toUpperCase())}
                            required
                            placeholder="Ex: 1.0, 1.6 VVT-I, 2.0 TFSI..."
                            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                        />
                    </div>

                    <div className="pt-2 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || !nome.trim()}
                            className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {mutation.isPending ? 'Salvando...' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ModalNovaMotorizacao;
