import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ModelosService } from '../../cadastros/modelos/modelos.service';
import { MontadorasService } from '../../cadastros/montadoras/montadoras.service';
import { TiposVeiculosService } from '../../cadastros/tipos-veiculos/tipos-veiculos.service';
import { IModelo } from '../../cadastros/modelos/modelos.types';
import { IMontadora } from '../../cadastros/montadoras/montadoras.types';
import { ITipoVeiculo } from '../../cadastros/tipos-veiculos/tipos-veiculos.types';

interface Props {
    /** Pré-seleciona montadora e tipo conforme o veículo em edição */
    preselectedMontadoraId?: string;
    preselectedTipoId?: string;
    preselectedNome?: string;
    onClose: () => void;
    onSuccess: (modelo: IModelo) => void;
}

const ModalNovoModelo: React.FC<Props> = ({
    preselectedNome,
    preselectedMontadoraId,
    preselectedTipoId,
    onClose,
    onSuccess,
}) => {
    const queryClient = useQueryClient();

    const [montadoras, setMontadoras] = useState<IMontadora[]>([]);
    const [tipos, setTipos] = useState<ITipoVeiculo[]>([]);
    const [loading, setLoading] = useState(true);

    const [nome, setNome] = useState(preselectedNome?.toUpperCase() || '');
    const [montadoraId, setMontadoraId] = useState(preselectedMontadoraId || '');
    const [tipoId, setTipoId] = useState(preselectedTipoId || '');

    useEffect(() => {
        Promise.all([MontadorasService.getAll(), TiposVeiculosService.getAll()])
            .then(([m, t]) => { setMontadoras(m); setTipos(t); })
            .finally(() => setLoading(false));
    }, []);

    const mutation = useMutation({
        mutationFn: () =>
            ModelosService.save({
                nome: nome.toUpperCase(),
                montadora_id: montadoraId,
                tipo_veiculo_id: tipoId,
            }),
        onSuccess: (novo) => {
            // Invalida o cache dos modelos para o select atualizar imediatamente
            queryClient.invalidateQueries({ queryKey: ['modelos_by_montadora_tipo', montadoraId, tipoId] });
            onSuccess(novo);
            onClose();
        },
        onError: (err: any) => {
            alert('Erro ao cadastrar modelo: ' + (err.message || 'Tente novamente.'));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim() || !montadoraId || !tipoId) return;
        mutation.mutate();
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Cadastro Rápido</span>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Novo Modelo</h2>
                    </div>
                    <button onClick={onClose} disabled={mutation.isPending} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-4">
                    {/* Nome */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome do Modelo *</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={e => setNome(e.target.value.toUpperCase())}
                            required
                            disabled={mutation.isPending}
                            placeholder="Ex: COROLLA, CIVIC..."
                            className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                        />
                    </div>
                    {/* Montadora */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Montadora (Marca) *</label>
                        <select
                            value={montadoraId}
                            onChange={e => setMontadoraId(e.target.value)}
                            required
                            disabled={loading || mutation.isPending}
                            className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="">{loading ? 'Carregando...' : 'Selecione a marca...'}</option>
                            {montadoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </select>
                    </div>
                    {/* Tipo */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Veículo *</label>
                        <select
                            value={tipoId}
                            onChange={e => setTipoId(e.target.value)}
                            required
                            disabled={loading || mutation.isPending}
                            className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="">{loading ? 'Carregando...' : 'Selecione o tipo...'}</option>
                            {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
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
                            disabled={mutation.isPending || !nome.trim() || !montadoraId || !tipoId}
                            className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {mutation.isPending ? (
                                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</>
                            ) : 'Cadastrar Modelo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ModalNovoModelo;
