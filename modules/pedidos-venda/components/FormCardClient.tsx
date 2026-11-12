
import React from 'react';
import { IParceiro } from '../../parceiros/parceiros.types';
import PartnerSelect from '../../parceiros/components/PartnerSelect';

interface Props {
  parceiros: IParceiro[];
  selectedId?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

const FormCardClient: React.FC<Props> = ({ parceiros, selectedId, onChange, disabled }) => {
  return (
    <div className="dc-panel animate-in slide-in-from-bottom-2">
      <h3 className="dc-section-title font-semibold text-slate-900 normal-case tracking-normal mb-6 flex items-center">
        <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 text-sm font-semibold">01</span>
        Identificação do Comprador
      </h3>
      <PartnerSelect
        parceiros={parceiros}
        selectedId={selectedId}
        onChange={(p) => onChange(p.id)}
        disabled={disabled}
      />
    </div>
  );
};

export default FormCardClient;
