
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
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center">
        <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 text-sm font-black">01</span>
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
