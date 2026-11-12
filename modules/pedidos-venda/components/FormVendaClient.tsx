
import React from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';
import { IParceiro, TipoParceiro } from '../../parceiros/parceiros.types';
import PartnerSelect from '../../parceiros/components/PartnerSelect';

interface Props {
  formData: Partial<IPedidoVenda>;
  parceiros: IParceiro[];
  onChange: (pId: string) => void;
  disabled?: boolean;
}

const FormVendaClient: React.FC<Props> = ({ formData, parceiros, onChange, disabled }) => {
  return (
    <div className="dc-panel">
      <h3 className="dc-section-title font-semibold text-slate-400 normal-case tracking-normal mb-6">02. Comprador</h3>
      <PartnerSelect
        parceiros={parceiros}
        selectedId={formData.cliente_id}
        onChange={(p) => onChange(p.id)}
        disabled={disabled}
        label="Comprador *"
        defaultType={TipoParceiro.CLIENTE}
      />
    </div>
  );
};

export default FormVendaClient;
