
import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';
import { IFormaPagamento } from '../../cadastros/formas-pagamento/formas-pagamento.types';

interface Props {
  formData: Partial<IPedidoCompra>;
  formas: IFormaPagamento[];
  onChange: (updates: Partial<IPedidoCompra>) => void;
  disabled?: boolean;
}

const FormCardFinance: React.FC<Props> = ({ formData, formas, onChange, disabled }) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center space-x-3 mb-8">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${disabled ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">04. Condições Financeiras</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Forma de Pagamento */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Forma de Pagamento</label>
          <div className="relative">
            <select
              required
              disabled={disabled}
              value={formData.forma_pagamento_id || ''}
              onChange={e => onChange({ forma_pagamento_id: e.target.value })}
              className={`w-full bg-white border ${!formData.forma_pagamento_id && !disabled ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 appearance-none transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50`}
            >
              <option value="">Selecione...</option>
              {formas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            {!disabled && (
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            )}
          </div>
        </div>

        {/* Mensagem Informativa */}
        <div className={`rounded-3xl p-5 border flex items-start space-x-3 ${disabled ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/50 border-indigo-100'}`}>
          <div className={`mt-0.5 shrink-0 ${disabled ? 'text-slate-400' : 'text-indigo-500'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${disabled ? 'text-slate-500' : 'text-indigo-900'}`}>
              {disabled ? 'Registro Concluído' : 'Nota do Sistema'}
            </p>
            <p className={`text-xs font-medium leading-relaxed ${disabled ? 'text-slate-400' : 'text-indigo-700'}`}>
              {disabled
                ? 'Os termos financeiros foram firmados e não podem ser alterados.'
                : <>O detalhamento de prazos e o valor exato serão vinculados na tela de <span className="font-bold">Detalhes do Pedido</span> após a gravação inicial.</>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormCardFinance;
