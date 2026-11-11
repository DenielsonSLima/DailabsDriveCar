
import React from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';
import { IParceiro, TipoParceiro } from '../../parceiros/parceiros.types';
import PartnerSelect from '../../parceiros/components/PartnerSelect';

interface Props {
  formData: Partial<IPedidoCompra>;
  parceiros: IParceiro[];
  onChange: (parceiro: IParceiro) => void;
  disabled?: boolean;
}

const FormCardSupplier: React.FC<Props> = ({ formData, parceiros, onChange, disabled }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-400 normal-case tracking-normal mb-6">02. Origem do Veículo</h3>
      <PartnerSelect
        parceiros={parceiros}
        selectedId={formData.fornecedor_id}
        onChange={onChange}
        disabled={disabled}
        label="Fornecedor *"
        defaultType={TipoParceiro.FORNECEDOR}
      />
    </div>
  );
};

export default FormCardSupplier;
