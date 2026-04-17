
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
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">02. Comprador</h3>
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
