
import React from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';
import { ICorretor } from '../../cadastros/corretores/corretores.types';

interface Props {
  formData: Partial<IPedidoVenda>;
  corretores: ICorretor[];
  onChange: (updates: Partial<IPedidoVenda>) => void;
  disabled?: boolean;
}

const FormVendaContext: React.FC<Props> = ({ formData, corretores, onChange, disabled }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-400 normal-case tracking-normal mb-6">01. Dados do Pedido</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1">Data da Venda</label>
          <input
            type="date"
            disabled={disabled}
            value={formData.data_venda || ''}
            onChange={e => onChange({ data_venda: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1">Vendedor / Corretor</label>
          <select
            disabled={disabled}
            value={formData.corretor_id || ''}
            onChange={e => onChange({ corretor_id: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <option value="">Selecione o Vendedor...</option>
            {corretores.map(c => <option key={c.id} value={c.id}>{c.nome} {c.sobrenome}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FormVendaContext;
