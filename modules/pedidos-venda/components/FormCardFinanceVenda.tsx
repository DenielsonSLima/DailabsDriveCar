import React from 'react';
import { IFormaPagamento } from '../../cadastros/formas-pagamento/formas-pagamento.types';
import { maskCurrency, parseCurrencyToNumber } from '../../../utils/currency';

interface Props {
  valorVenda: number;
  formaPagamentoId: string;
  formas: IFormaPagamento[];
  dataVencimento?: string;
  onChange: (updates: any) => void;
  disabled?: boolean;
}

const FormCardFinanceVenda: React.FC<Props> = ({ valorVenda, formaPagamentoId, formas, dataVencimento, onChange, disabled }) => {
  const [valorRaw, setValorRaw] = React.useState('');
  const selectedForma = formas.find(f => f.id === formaPagamentoId);
  const exigeVencimento = selectedForma?.destino_lancamento === 'CONTAS_RECEBER';

  React.useEffect(() => {
    if (valorVenda !== undefined) {
      setValorRaw(maskCurrency(valorVenda));
    }
  }, [valorVenda]);

  const handleValueChange = (val: string) => {
    const masked = maskCurrency(val);
    setValorRaw(masked);
    const parsed = parseCurrencyToNumber(masked);
    onChange({ valor_venda: parsed });
  };

  const displayValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center">
        <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 text-sm font-black">03</span>
        Negociação e Pagamento
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Preço Final de Venda</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
            <input
              type="text"
              disabled={disabled}
              value={valorRaw}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 pl-12 text-2xl font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Forma de Recebimento</label>
          <select
            value={formaPagamentoId}
            disabled={disabled}
            onChange={(e) => onChange({ forma_pagamento_id: e.target.value, data_vencimento: new Date().toISOString().split('T')[0] })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all"
          >
            <option value="">Selecione...</option>
            {formas.map(fp => <option key={fp.id} value={fp.id}>{fp.nome}</option>)}
          </select>
        </div>

        {exigeVencimento && (
          <div className="md:col-span-2 bg-rose-50 p-6 rounded-3xl border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-right duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Vencimento do Título</p>
                <p className="text-xs text-rose-500 font-medium leading-relaxed">Esta forma de pagamento gerará um título no contas a receber.</p>
              </div>
            </div>
            <input
              type="date"
              disabled={disabled}
              value={dataVencimento}
              onChange={e => onChange({ data_vencimento: e.target.value })}
              className="bg-white border border-rose-200 rounded-xl px-5 py-3 font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormCardFinanceVenda;
