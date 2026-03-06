import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';
import { IFormaPagamento } from '../../cadastros/formas-pagamento/formas-pagamento.types';
import { maskCurrency, parseCurrencyToNumber } from '../../../utils/currency';

interface Props {
  formData: Partial<IPedidoCompra>;
  formasPagamento: IFormaPagamento[];
  onChange: (updates: Partial<IPedidoCompra>) => void;
}

const FormCardFinanceSummary: React.FC<Props> = ({ formData, formasPagamento, onChange }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCurrency(e.target.value);
    const val = parseCurrencyToNumber(masked);
    onChange({ valor_negociado: val });
  };

  const displayValue = maskCurrency(formData.valor_negociado || 0);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center">
        <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3 text-sm">03</span>
        Financeiro
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Valor Negociado</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
            <input
              type="text"
              value={displayValue}
              onChange={handleValueChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pl-12 text-2xl font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Forma de Pagamento</label>
          <select
            value={formData.forma_pagamento_id || ''}
            onChange={(e) => onChange({ forma_pagamento_id: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
          >
            <option value="">Selecione...</option>
            {formasPagamento.map(fp => <option key={fp.id} value={fp.id}>{fp.nome}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FormCardFinanceSummary;
