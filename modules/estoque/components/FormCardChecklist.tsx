
import React, { useState, useEffect } from 'react';
import { IVeiculo } from '../estoque.types';
import { CaracteristicasService } from '../../cadastros/caracteristicas/caracteristicas.service';
import { OpcionaisService } from '../../cadastros/opcionais/opcionais.service';
import { ICaracteristica } from '../../cadastros/caracteristicas/caracteristicas.types';
import { IOpcional } from '../../cadastros/opcionais/opcionais.types';

interface Props {
  formData: Partial<IVeiculo>;
  onChange: (updates: Partial<IVeiculo>) => void;
}

const FormCardChecklist: React.FC<Props> = ({ formData, onChange }) => {
  const [caracteristicas, setCaracteristicas] = useState<ICaracteristica[]>([]);
  const [opcionais, setOpcionais] = useState<IOpcional[]>([]);

  useEffect(() => {
    Promise.all([CaracteristicasService.getAll(), OpcionaisService.getAll()])
      .then(([c, o]) => {
        setCaracteristicas(c);
        setOpcionais(o);
      });
  }, []);

  const toggle = (id: string, field: 'caracteristicas_ids' | 'opcionais_ids') => {
    const list = formData[field] || [];
    const updated = list.includes(id) ? list.filter(i => i !== id) : [...list, id];
    onChange({ [field]: updated });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 normal-case tracking-normal mb-6 flex items-center justify-between">
          <span>Características (Tags)</span>
          <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-xs border border-indigo-100">{formData.caracteristicas_ids?.length || 0}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {caracteristicas.map(item => (
            <button key={item.id} type="button" onClick={() => toggle(item.id, 'caracteristicas_ids')} className={`px-3 py-2 rounded-xl text-xs font-semibold normal-case transition-all border ${formData.caracteristicas_ids?.includes(item.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-400'}`}>
              {item.nome}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 normal-case tracking-normal mb-6 flex items-center justify-between">
          <span>Itens Opcionais</span>
          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-xs border border-emerald-100">{formData.opcionais_ids?.length || 0}</span>
        </h3>
        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {opcionais.map(item => (
            <button key={item.id} type="button" onClick={() => toggle(item.id, 'opcionais_ids')} className={`px-3 py-2 rounded-xl text-xs font-semibold normal-case transition-all border ${formData.opcionais_ids?.includes(item.id) ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-400'}`}>
              {item.nome}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormCardChecklist;
