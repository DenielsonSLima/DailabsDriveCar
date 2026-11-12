
import React, { useState, useEffect } from 'react';

interface Props {
  initialValue?: string;
  onSave: (value: string) => void;
  isSaving: boolean;
}

const CardAnnotations: React.FC<Props> = ({ initialValue = '', onSave, isSaving }) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setValue(initialValue);
  }, [initialValue, isEditing]);

  const handleConfirm = () => {
    onSave(value);
    setIsEditing(false);
  };

  return (
    <div className="dc-panel h-full flex flex-col hover:border-amber-300 transition-all">
      <div className="flex items-center justify-between mb-8">
        <h3 className="dc-section-title font-semibold text-slate-400 normal-case tracking-normal flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Dossiê de Observações
        </h3>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="dc-button text-xs font-semibold normal-case text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
          >
            Editar Notas
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setValue(initialValue); setIsEditing(false); }}
              className="dc-button text-xs font-semibold normal-case text-slate-400 px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              className="dc-button text-xs font-semibold normal-case text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center"
            >
              {isSaving && <div className="w-2 h-2 border border-emerald-600 border-t-transparent animate-spin rounded-full mr-1.5"></div>}
              Salvar
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={6}
          className="dc-input flex-1 w-full bg-slate-50 border-2 border-indigo-100 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none shadow-inner"
          placeholder="Registre detalhes cruciais da negociação, estado do veículo no recebimento, ou combinados internos..."
        />
      ) : (
        <div className={`flex-1 p-4 rounded-2xl border transition-all ${value ? 'bg-amber-50/20 border-amber-100' : 'bg-slate-50 border-slate-100 border-dashed flex items-center justify-center'}`}>
          {value ? (
            <p className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed font-medium opacity-80 italic">
              "{value}"
            </p>
          ) : (
            <div className="text-center py-2.5">
              <p className="text-slate-300 text-xs font-semibold normal-case tracking-normal">Nenhuma observação interna registrada.</p>
              <button onClick={() => setIsEditing(true)} className="dc-button text-xs font-semibold text-indigo-400 mt-2 hover:underline">CLIQUE PARA ADICIONAR NOTA</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardAnnotations;
