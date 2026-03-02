
import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';

interface Props {
  formData: Partial<IPedidoCompra>;
  onToggle: (checked: boolean) => void;
  onChange: (updates: Partial<IPedidoCompra>) => void;
  disabled?: boolean;
}

const FormCardAddress: React.FC<Props> = ({ formData, onToggle, onChange, disabled }) => {
  const isLocked = formData.endereco_igual_cadastro || disabled;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">03. Local de Retirada</h3>
        </div>

        <label className={`flex items-center space-x-3 group bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-50'}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${disabled ? 'text-slate-400' : 'text-slate-500 group-hover:text-indigo-600'}`}>Sincronizar com Cadastro?</span>
          <div className="relative">
            <input
              type="checkbox"
              disabled={disabled}
              checked={formData.endereco_igual_cadastro}
              onChange={e => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
        </label>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 transition-all duration-500 ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
        <div className="md:col-span-3">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">CEP</label>
          <input
            disabled={isLocked}
            placeholder="00000-000"
            value={formData.cep || ''}
            onChange={e => onChange({ cep: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <div className="md:col-span-9">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Logradouro / Rua</label>
          <input
            disabled={isLocked}
            placeholder="Rua, Avenida..."
            value={formData.logradouro || ''}
            onChange={e => onChange({ logradouro: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Nº</label>
          <input
            disabled={isLocked}
            placeholder="S/N"
            value={formData.numero || ''}
            onChange={e => onChange({ numero: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md text-center"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Bairro</label>
          <input
            disabled={isLocked}
            placeholder="Seu Bairro"
            value={formData.bairro || ''}
            onChange={e => onChange({ bairro: e.target.value.toUpperCase() })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Cidade</label>
          <input
            disabled={isLocked}
            placeholder="Nome da Cidade"
            value={formData.cidade || ''}
            onChange={e => onChange({ cidade: e.target.value.toUpperCase() })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">UF</label>
          <input
            disabled={isLocked}
            placeholder="UF"
            value={formData.uf || ''}
            onChange={e => onChange({ uf: e.target.value.toUpperCase() })}
            maxLength={2}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-black text-slate-900 text-center outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>

        <div className="md:col-span-12">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Complemento</label>
          <input
            disabled={isLocked}
            placeholder="Sala, Bloco, etc..."
            value={formData.complemento || ''}
            onChange={e => onChange({ complemento: e.target.value.toUpperCase() })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default FormCardAddress;
