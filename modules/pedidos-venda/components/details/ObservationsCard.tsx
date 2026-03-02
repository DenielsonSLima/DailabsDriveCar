
import React, { useState, useEffect } from 'react';

interface Props {
  observacoes?: string;
  onSave: (value: string) => void;
  isSaving: boolean;
}

const ObservationsCard: React.FC<Props> = ({ observacoes = '', onSave, isSaving }) => {
  const [value, setValue] = useState(observacoes);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setValue(observacoes);
  }, [observacoes, isEditing]);

  const handleConfirm = () => {
    onSave(value);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-8 duration-700 w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Notas da Negociação</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle interno de combinados</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100/50 flex items-center"
          >
            <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {value ? 'Editar Notas' : 'Adicionar Nota'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setValue(observacoes); setIsEditing(false); }}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center"
            >
              {isSaving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>}
              Gravar Notas
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={5}
          disabled={isSaving}
          className="w-full bg-white border-2 border-indigo-100 rounded-[1.5rem] p-6 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-sm hover:shadow-md"
          placeholder="Digite detalhes da negociação, brinde prometido, documentação pendente..."
        />
      ) : (
        <div className={`p-6 rounded-[1.5rem] border transition-all ${value ? 'bg-amber-50/20 border-amber-100' : 'bg-slate-50 border-slate-100 border-dashed py-10'}`}>
          {value ? (
            <p className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed font-medium">
              {value}
            </p>
          ) : (
            <div className="text-center cursor-pointer" onClick={() => setIsEditing(true)}>
              <p className="text-slate-300 text-xs italic uppercase font-bold tracking-widest">
                Nenhuma nota registrada para esta venda.
              </p>
              <span className="text-[10px] text-indigo-400 font-bold uppercase mt-2 inline-block hover:underline">Clique para adicionar</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ObservationsCard;
