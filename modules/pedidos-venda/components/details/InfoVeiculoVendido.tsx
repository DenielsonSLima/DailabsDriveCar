
import React from 'react';
import { IVeiculo } from '../../../estoque/estoque.types';

interface Props {
  veiculo?: IVeiculo | null;
}

const InfoVeiculoVendido: React.FC<Props> = ({ veiculo }) => {
  if (!veiculo) {
    return (
      <div className="dc-panel text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-400 font-semibold normal-case text-xs tracking-normal">Nenhum veículo vinculado a esta venda.</p>
      </div>
    );
  }

  const v = veiculo as any;
  const capaUrl = v?.fotos?.find((f: any) => f.is_capa)?.url || v?.fotos?.[0]?.url;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-bottom-8">
      <div className="grid grid-cols-1 md:grid-cols-12">
         <div className="md:col-span-4 h-64 md:h-auto bg-slate-900 relative">
            {capaUrl ? <img src={capaUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-700">Sem Foto</div>}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-xs font-semibold normal-case tracking-normal shadow-sm">
              {veiculo.placa || 'SEM PLACA'}
            </div>
         </div>
         <div className="md:col-span-8 p-4">
            <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal mb-1">{v.montadora?.nome}</p>
            <h2 className="dc-section-title font-semibold text-slate-900 normal-case tracking-normal">{v.modelo?.nome || 'Modelo não informado'}</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">{v.versao?.nome}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {[
                 { label: 'KM', val: veiculo.km?.toLocaleString() || '0' },
                 { label: 'Motor', val: veiculo.motorizacao || '---' },
                 { label: 'Câmbio', val: veiculo.transmissao || '---' },
                 { label: 'Ano', val: `${veiculo.ano_fabricacao || '---'}/${veiculo.ano_modelo || '---'}` },
               ].map((spec, i) => (
                 <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 normal-case mb-1">{spec.label}</p>
                    <p className="text-xs font-semibold text-slate-800 normal-case truncate">{spec.val}</p>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default InfoVeiculoVendido;
