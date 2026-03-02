
import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';

interface Props {
  formData: Partial<IPedidoCompra>;
  onChange: (updates: Partial<IPedidoCompra>) => void;
  disabled?: boolean;
}

const FormCardNotes: React.FC<Props> = ({ formData, onChange, disabled }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">05. Notas Internas</h3>
      <textarea
        disabled={disabled}
        value={formData.observacoes || ''}
        onChange={e => onChange({ observacoes: e.target.value })}
        rows={4}
        className="w-full bg-white border border-slate-200 rounded-[2rem] p-6 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all shadow-sm hover:shadow-md disabled:opacity-50"
        placeholder={disabled ? "Sem observações adicionais." : "Detalhes adicionais da negociação..."}
      />
    </div>
  );
};

export default FormCardNotes;
