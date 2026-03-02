
import React, { useState, useEffect } from 'react';
import { IVeiculo } from '../estoque.types';
import { SociosService } from '../../ajustes/socios/socios.service';
import { ISocio } from '../../ajustes/socios/socios.types';
import EstoqueSocios from './EstoqueSocios';

interface Props {
  formData: Partial<IVeiculo>;
  onChange: (updates: Partial<IVeiculo>) => void;
  onNotification: (msg: string, type: any) => void;
  isConsignacao?: boolean;
}

const FormCardFinance: React.FC<Props> = ({ formData, onChange, onNotification, isConsignacao = false }) => {
  const [sociosDisponiveis, setSociosDisponiveis] = useState<ISocio[]>([]);

  useEffect(() => {
    SociosService.getAll().then(data => setSociosDisponiveis(data.filter(s => s.ativo)));
  }, []);

  const handleCurrencyChange = (val: string, field: 'valor_custo' | 'valor_venda') => {
    const numeric = Number(val.replace(/\D/g, '')) / 100;
    onChange({ [field]: numeric });
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className={`bg-white rounded-[2.5rem] border shadow-sm overflow-hidden animate-in slide-in-from-bottom-3 ${isConsignacao ? 'border-violet-200' : 'border-slate-200'}`}>
      <div className={`${isConsignacao ? 'bg-violet-900' : 'bg-slate-900'} p-8 text-white flex items-center justify-between transition-colors`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border ${isConsignacao ? 'bg-white/20 border-white/20 text-violet-100' : 'bg-white/10 border-white/10 text-indigo-400'}`}>2</div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Financeiro & Investimento</h2>
        </div>
      </div>
      <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <label className={`block text-[10px] font-black uppercase mb-3 ml-1 tracking-widest ${isConsignacao ? 'text-violet-500' : 'text-slate-400'}`}>
              {isConsignacao ? 'Valor do Repasse Acordado (Consignação)' : 'Custo de Compra'}
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">R$</span>
              <input
                type="text"
                value={formatCurrency(formData.valor_custo).replace('R$', '').trim()}
                onChange={e => handleCurrencyChange(e.target.value, 'valor_custo')}
                className="w-full bg-white border-2 border-slate-100 rounded-3xl px-6 py-5 pl-14 text-2xl font-black text-[#111827] outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-emerald-600 uppercase mb-3 ml-1 tracking-widest">Preço de Venda (Anúncio)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-3xl">R$</span>
              <input
                type="text"
                value={formatCurrency(formData.valor_venda).replace('R$', '').trim()}
                onChange={e => handleCurrencyChange(e.target.value, 'valor_venda')}
                className="w-full bg-white border-2 border-emerald-100 rounded-3xl px-6 py-6 pl-16 text-4xl font-black text-[#111827] outline-none focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <EstoqueSocios
            sociosDisponiveis={sociosDisponiveis}
            sociosVinculados={formData.socios || []}
            valorCustoTotal={formData.valor_custo || 0}
            onChange={newSocios => onChange({ socios: newSocios })}
          />
        </div>
      </div>
    </div>
  );
};

export default FormCardFinance;
