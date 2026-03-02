
import React from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  formData: Partial<IPedidoVenda>;
  onChange: (updates: Partial<IPedidoVenda>) => void;
  disabled?: boolean;
}

const FormVendaNotes: React.FC<Props> = ({ formData, onChange, disabled }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">05. Notas da Venda</h3>
      <textarea
        disabled={disabled}
        value={formData.observacoes || ''}
        onChange={e => onChange({ observacoes: e.target.value })}
        rows={4}
        className="w-full bg-white border border-slate-200 rounded-[2rem] p-6 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all shadow-sm hover:shadow-md disabled:opacity-50"
        placeholder={disabled ? "Sem observações adicionais." : "Detalhes importantes da negociação com o cliente..."}
      />
    </div>
  );
};

export default FormVendaNotes;
