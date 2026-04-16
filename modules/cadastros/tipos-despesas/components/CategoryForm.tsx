
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ICategoriaDespesa, IGrupoDespesa } from '../tipos-despesas.types';

interface Props {
  grupo: IGrupoDespesa;
  initialData?: ICategoriaDespesa | null;
  onClose: () => void;
  onSubmit: (data: Partial<ICategoriaDespesa>) => void;
  isSaving: boolean;
}

const CategoryForm: React.FC<Props> = ({ grupo, initialData, onClose, onSubmit, isSaving }) => {
  const [nome, setNome] = useState('');

  useEffect(() => {
    if (initialData) setNome(initialData.nome);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onSubmit({
      id: initialData?.id,
      grupo_id: grupo.id,
      nome: nome.trim()
    });
  };
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-2 border-indigo-100">
        <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
            {initialData ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">
            Grupo: {grupo.nome}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Nome da Despesa</label>
            <input 
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Ex: Energia Elétrica"
            />
          </div>
          <div className="flex space-x-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default CategoryForm;
