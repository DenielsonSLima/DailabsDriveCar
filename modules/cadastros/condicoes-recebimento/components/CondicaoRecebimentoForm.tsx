
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ICondicaoRecebimento } from '../condicoes-recebimento.types';

interface Props {
  initialData: ICondicaoRecebimento | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ICondicaoRecebimento>) => void;
}

const CondicaoRecebimentoForm: React.FC<Props> = ({ initialData, isSaving, onClose, onSubmit }) => {
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
    <div data-drivecar-ui className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="dc-modal-title">
              {initialData ? 'Editar Condição' : 'Nova Condição'}
            </h2>
            <p className="text-slate-500 text-xs font-medium normal-case tracking-normal mt-1">Regra de prazo ou recebimento</p>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Descrição da Condição</label>
            <input 
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value.toUpperCase())}
              disabled={isSaving}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
              placeholder="Ex: À Vista, 30/60/90 Dias, Entrada 50%..."
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 text-slate-500 font-semibold normal-case text-xs tracking-normal hover:bg-slate-50 rounded-xl"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving} 
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold normal-case text-xs tracking-normal shadow-sm shadow-none disabled:opacity-50 min-w-[140px] flex items-center justify-center hover:bg-emerald-700 transition-all"
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

export default CondicaoRecebimentoForm;
