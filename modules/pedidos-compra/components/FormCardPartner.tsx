
import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';
import { IParceiro } from '../../parceiros/parceiros.types';
import PartnerSelect from '../../parceiros/components/PartnerSelect';

interface Props {
  formData: Partial<IPedidoCompra>;
  parceiros: IParceiro[];
  onChange: (updates: Partial<IPedidoCompra>) => void;
}

const FormCardPartner: React.FC<Props> = ({ formData, parceiros, onChange }) => {
  const handleSelect = (p: IParceiro) => {
    const updates: Partial<IPedidoCompra> = { fornecedor_id: p.id };
    
    // Se estiver marcado para usar endereço do cadastro, atualiza os campos de entrega
    if (formData.endereco_igual_cadastro) {
      Object.assign(updates, {
        cep: p.cep, 
        logradouro: p.logradouro, 
        numero: p.numero,
        bairro: p.bairro, 
        cidade: p.cidade, 
        uf: p.uf, 
        complemento: p.complemento
      });
    }
    onChange(updates);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-3 duration-500">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center">
        <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3 text-sm">02</span>
        Origem do Veículo (Fornecedor)
      </h3>
      <PartnerSelect 
        parceiros={parceiros} 
        selectedId={formData.fornecedor_id} 
        onChange={handleSelect} 
      />
    </div>
  );
};

export default FormCardPartner;
