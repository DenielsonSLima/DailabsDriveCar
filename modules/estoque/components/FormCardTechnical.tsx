
import React from 'react';
import { IVeiculo } from '../estoque.types';
import { ICor } from '../../cadastros/cores/cores.types';

interface Props {
  formData: Partial<IVeiculo>;
  cores: ICor[];
  onChange: (updates: Partial<IVeiculo>) => void;
}

const FormCardTechnical: React.FC<Props> = ({ formData, cores, onChange }) => {
  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    onChange({ placa: val });
  };

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ km: 0 });
      return;
    }
    const num = parseInt(val.replace(/\D/g, ''));
    if (!isNaN(num)) {
      onChange({ km: num });
    }
  };

  const selectedCor = cores.find(c => c.id === formData.cor_id);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center">
        <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3 text-sm">03</span>
        Dados Técnicos & Documentação
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          {/* Seletor de Cor */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest flex justify-between">
              Cor do Veículo
              <span className="text-indigo-600 font-bold">{selectedCor?.nome || 'Não selecionada'}</span>
            </label>
            <div className="flex flex-wrap gap-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
              {cores.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Nenhuma cor cadastrada no sistema.</p>
              ) : (
                cores.map(cor => (
                  <button
                    key={cor.id}
                    type="button"
                    onClick={() => onChange({ cor_id: cor.id })}
                    className={`w-10 h-10 rounded-full border-4 transition-all transform hover:scale-110 shadow-sm ${formData.cor_id === cor.id
                      ? 'border-indigo-500 ring-2 ring-indigo-200 ring-offset-2'
                      : 'border-white hover:border-slate-200'
                      }`}
                    style={{ backgroundColor: cor.rgb_hex }}
                    title={cor.nome}
                  />
                ))
              )}
            </div>
          </div>

          {/* Placa */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest">Identificação Placa</label>
            <div className="relative max-w-[300px] mx-auto">
              <div className="absolute top-0 left-0 w-full h-4 bg-blue-700 rounded-t-lg flex items-center justify-between px-2">
                <span className="text-[6px] font-bold text-white">BRASIL</span>
                <div className="w-4 h-2.5 bg-green-500 opacity-20"></div>
              </div>
              <input
                type="text"
                value={formData.placa || ''}
                onChange={handlePlacaChange}
                maxLength={7}
                className="w-full bg-white border-2 border-slate-800 rounded-lg pt-6 pb-2 text-center text-4xl font-black uppercase tracking-widest text-slate-800 outline-none font-mono"
                placeholder="ABC1D23"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 flex flex-col">
          {/* Quilometragem */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Quilometragem (KM)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.km === 0 ? '' : formData.km.toString()}
              onChange={handleKmChange}
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 text-2xl font-black text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 text-right"
              placeholder="0"
            />
          </div>

          {/* Chassi */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Chassi (17 Dígitos)</label>
            <input
              type="text"
              value={formData.chassi || ''}
              onChange={e => onChange({ chassi: e.target.value.toUpperCase() })}
              maxLength={17}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-black text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all"
              placeholder="DIGITE O CHASSI..."
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default FormCardTechnical;
