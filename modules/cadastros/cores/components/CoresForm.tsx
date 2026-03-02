
import React, { useState, useEffect } from 'react';
import { ICor } from '../cores.types';

interface Props {
  initialData: ICor | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ICor>) => void;
}

const CoresForm: React.FC<Props> = ({ initialData, isSaving, onClose, onSubmit }) => {
  const [nome, setNome] = useState('');
  const [hex, setHex] = useState('#000000');

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome);
      setHex(initialData.rgb_hex || '#000000');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onSubmit({ id: initialData?.id, nome: nome.trim(), rgb_hex: hex });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              {initialData ? 'Editar Cor' : 'Nova Cor'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Acabamento e Pintura</p>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Descrição da Cor</label>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value.toUpperCase())}
              disabled={isSaving}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              placeholder="Ex: Branco Perolizado, Prata Bari..."
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Seletor Visual</label>
            <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl border border-slate-100">
              <div className="relative overflow-hidden w-16 h-16 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <input
                  type="color"
                  value={hex}
                  onChange={e => setHex(e.target.value)}
                  disabled={isSaving}
                  className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={hex.toUpperCase()}
                  onChange={e => setHex(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm uppercase font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none"
                  maxLength={7}
                />
                <p className="text-[9px] text-slate-400 mt-1 ml-1 font-medium">Clique na cor para alterar</p>
              </div>
            </div>
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
};

export default CoresForm;
