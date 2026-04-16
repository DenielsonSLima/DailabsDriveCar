
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IMotorizacao } from '../motorizacao.types';

interface Props {
  initialData: IMotorizacao | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IMotorizacao>) => void;
}

const MotorizacaoForm: React.FC<Props> = ({ initialData, isSaving, onClose, onSubmit }) => {
  const [nome, setNome] = useState('');

  useEffect(() => {
    if (initialData) setNome(initialData.nome);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onSubmit({ id: initialData?.id, nome: nome.trim() });
  };
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              {initialData ? 'Editar Motor' : 'Nova Motorização'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Potência e Cilindrada</p>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Descrição do Motor</label>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value.toUpperCase())}
              disabled={isSaving}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              placeholder="Ex: 1.0, 1.4 TSI, 2.0 Turbo..."
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50 min-w-[140px] flex items-center justify-center"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default MotorizacaoForm;
