
import React from 'react';
import { IVeiculo } from '../../estoque/estoque.types';

interface Props {
  veiculos: IVeiculo[];
  selectedId?: string;
  onSelect: (veiculo: IVeiculo) => void;
  disabled?: boolean;
}

const FormCardVehicleSelection: React.FC<Props> = ({ veiculos, selectedId, onSelect, disabled }) => {
  const selectedVehicle = veiculos.find(v => v.id === selectedId) as any;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-3">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center">
        <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 text-sm font-black">02</span>
        Veículo do Estoque
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Selecione uma Unidade Disponível</label>
          <select
            value={selectedId || ''}
            disabled={disabled}
            onChange={(e) => {
              const v = veiculos.find(x => x.id === e.target.value);
              if (v) onSelect(v);
            }}
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all"
          >
            <option value="">Buscar veículo no pátio...</option>
            {veiculos.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.montadora?.nome} {v.modelo?.nome} • {v.placa} ({v.ano_modelo})
              </option>
            ))}
          </select>
        </div>

        {selectedVehicle && (
          <div className="lg:col-span-12 bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center gap-6 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 p-2 shrink-0">
              {selectedVehicle.fotos?.[0] ? (
                <img src={selectedVehicle.fotos[0].url} className="w-full h-full object-cover rounded-xl" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{selectedVehicle.placa}</p>
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate">
                {selectedVehicle.montadora?.nome} {selectedVehicle.modelo?.nome}
              </h4>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs font-bold text-slate-500 uppercase">{selectedVehicle.km.toLocaleString()} KM</span>
                <span className="text-xs font-bold text-slate-500 uppercase">{selectedVehicle.combustivel}</span>
                <span className="text-xs font-bold text-slate-500 uppercase">{selectedVehicle.transmissao}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormCardVehicleSelection;
