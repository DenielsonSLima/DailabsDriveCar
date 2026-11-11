
import React from 'react';
import { IVeiculo } from '../../estoque.types';

interface Props {
  veiculo: IVeiculo;
}

const VehicleQuickInfoCard: React.FC<Props> = ({ veiculo }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-in slide-in-from-top-4 duration-500">
      
      {/* Bloco Placa - Estilo Mercosul Premium */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal ml-1">Placa Identificação</span>
          <div className="flex items-center mt-1 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
            <div className="w-4 h-2.5 bg-blue-700 rounded-[1px] mr-2 relative overflow-hidden shadow-sm">
               <div className="absolute top-0 left-0 w-full h-0.5 bg-green-500 opacity-30"></div>
            </div>
            <span className="text-xl font-semibold text-slate-900 font-mono tracking-normal normal-case">{veiculo.placa || '---'}</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
        </div>
      </div>

      {/* Bloco Quilometragem */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal ml-1">Uso / Quilometragem</span>
          <p className="text-2xl font-semibold text-slate-900 tracking-normal mt-1">
            {veiculo.km.toLocaleString('pt-BR')} <small className="text-xs text-slate-400 normal-case">km</small>
          </p>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
      </div>

      {/* Bloco Chassi */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal ml-1">Número do Chassi</span>
          <p className="text-sm font-semibold text-slate-700 font-mono truncate mt-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100" title={veiculo.chassi}>
            {veiculo.chassi || '-----------------'}
          </p>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
      </div>

    </div>
  );
};

export default VehicleQuickInfoCard;
