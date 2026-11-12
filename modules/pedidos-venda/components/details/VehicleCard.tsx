
import React from 'react';
import { IVeiculo } from '../../../estoque/estoque.types';

interface Props {
  veiculo?: IVeiculo | null;
}

const VehicleCard: React.FC<Props> = ({ veiculo }) => {
  if (!veiculo) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center shadow-sm">
        <p className="text-slate-400 font-semibold normal-case text-xs tracking-normal">Nenhum veículo vinculado.</p>
      </div>
    );
  }

  const v = veiculo as any;
  const capaUrl = v?.fotos?.find((f: any) => f.is_capa)?.url || v?.fotos?.[0]?.url;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-left-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-12">
         <div className="md:col-span-4 h-56 md:h-auto bg-slate-900 relative">
            {capaUrl ? (
              <img src={capaUrl} className="w-full h-full object-cover" alt="Veículo" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700 normal-case font-semibold text-xs">Sem Foto</div>
            )}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-xs font-semibold normal-case shadow-sm border border-white/50">
              {veiculo.placa || 'SEM PLACA'}
            </div>
         </div>
         <div className="md:col-span-8 p-4">
            <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal mb-1">{v.montadora?.nome}</p>
            <h2 className="dc-section-title font-semibold text-slate-900 normal-case tracking-normal">{v.modelo?.nome}</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">{v.versao?.nome}</p>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 normal-case mb-0.5">KM</p>
                  <p className="text-xs font-semibold text-slate-800">{veiculo.km?.toLocaleString() || '0'} km</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 normal-case mb-0.5">Câmbio</p>
                  <p className="text-xs font-semibold text-slate-800 normal-case">{veiculo.transmissao}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 normal-case mb-0.5">Motor</p>
                  <p className="text-xs font-semibold text-slate-800">{veiculo.motorizacao}</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 normal-case mb-0.5">Ano/Mod</p>
                  <p className="text-xs font-semibold text-slate-800">{veiculo.ano_fabricacao}/{veiculo.ano_modelo}</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default VehicleCard;
