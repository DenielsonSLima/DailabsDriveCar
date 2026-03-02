
import React from 'react';
import { IVeiculo } from '../estoque.types';

interface Props {
  formData: Partial<IVeiculo>;
  onChange: (updates: Partial<IVeiculo>) => void;
}

const FormCardObservations: React.FC<Props> = ({ formData, onChange }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Notas & Observações Internas</h3>
      <textarea
        value={formData.observacoes || ''}
        onChange={e => onChange({ observacoes: e.target.value })}
        rows={5}
        className="w-full bg-white border border-slate-200 rounded-[1.5rem] px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px] resize-none placeholder:font-medium placeholder:text-slate-300"
        placeholder="Relatório sobre pneus, lataria, revisões pendentes, etc..."
      />
    </div>
  );
};

export default FormCardObservations;
