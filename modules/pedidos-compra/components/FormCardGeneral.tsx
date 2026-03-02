
import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';
import { ICorretor } from '../../cadastros/corretores/corretores.types';

interface Props {
  formData: Partial<IPedidoCompra>;
  corretores: ICorretor[];
  onChange: (updates: Partial<IPedidoCompra>) => void;
}

const FormCardGeneral: React.FC<Props> = ({ formData, corretores, onChange }) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2 duration-500">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center">
        <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3 text-sm">01</span>
        Dados da Negociação
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Título / Identificação do Pedido</label>
          <input
            type="text"
            value={formData.descricao_veiculo || ''}
            onChange={(e) => onChange({ descricao_veiculo: e.target.value })}
            placeholder="Ex: Compra Lote 02 - João Silva"
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <p className="text-[9px] text-slate-400 mt-2 ml-1 font-bold uppercase tracking-wider">Identificador único para este contrato de compra.</p>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Data da Aquisição</label>
          <input
            type="date"
            value={formData.data_compra || ''}
            onChange={(e) => onChange({ data_compra: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Intermediador (Corretor)</label>
          <select
            value={formData.corretor_id || ''}
            onChange={(e) => onChange({ corretor_id: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all cursor-pointer"
          >
            <option value="">Nenhum / Compra Direta</option>
            {corretores.map(c => <option key={c.id} value={c.id}>{c.nome} {c.sobrenome}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FormCardGeneral;
