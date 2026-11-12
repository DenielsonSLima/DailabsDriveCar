
import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';
import { ICorretor } from '../../../cadastros/corretores/corretores.types';

interface Props {
  formData: Partial<IPedidoCompra>;
  corretores: ICorretor[];
  onChange: (updates: Partial<IPedidoCompra>) => void;
}

const CardGeneral: React.FC<Props> = ({ formData, corretores, onChange }) => {
  return (
    <div className="dc-panel animate-in slide-in-from-bottom-2">
      <h3 className="dc-section-title font-semibold text-slate-900 normal-case tracking-normal mb-6">01. Identificação</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1">Data da Compra</label>
          <input type="date" value={formData.data_compra || ''} onChange={e => onChange({ data_compra: e.target.value })} className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1">Corretor / Intermediário</label>
          <select value={formData.corretor_id || ''} onChange={e => onChange({ corretor_id: e.target.value })} className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
            <option value="">Selecione...</option>
            {corretores.map(c => <option key={c.id} value={c.id}>{c.nome} {c.sobrenome}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1">Descrição Simples do Veículo</label>
          <input type="text" value={formData.descricao_veiculo || ''} onChange={e => onChange({ descricao_veiculo: e.target.value })} placeholder="Ex: Corolla XEI 2022 Branco" className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
    </div>
  );
};

export default CardGeneral;
