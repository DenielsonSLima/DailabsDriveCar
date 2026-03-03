import React, { useState, useMemo } from 'react';
import { IVeiculo } from '../../estoque/estoque.types';

interface Props {
  veiculos: IVeiculo[];
  selectedId?: string;
  onSelect: (veiculoId: string) => void;
  disabled?: boolean;
}

const MarketingVehicleSelection: React.FC<Props> = ({ veiculos, selectedId, onSelect, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const selectedVehicle = veiculos.find(v => v.id === selectedId) as any;

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return veiculos.filter(v => {
      if (!term) return true;
      const text = [
        v.placa,
        v.montadora?.nome,
        v.modelo?.nome,
        v.versao?.nome
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(term);
    });
  }, [veiculos, searchTerm]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsChanging(false);
    setSearchTerm('');
  };

  if (selectedVehicle && !isChanging) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-4 animate-in slide-in-from-bottom-3">
        <div className="flex items-center justify-between ml-1 mb-2">
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Veículo Selecionado</label>
          <button
            onClick={() => setIsChanging(true)}
            disabled={disabled}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Trocar Veículo
          </button>
        </div>
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center gap-6 animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-white rounded-2xl border border-slate-200 p-2 shrink-0">
            {selectedVehicle.fotos?.[0] ? (
              <img src={selectedVehicle.fotos[0].url} className="w-full h-full object-cover rounded-xl shadow-sm" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{selectedVehicle.placa}</p>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate">
              {selectedVehicle.montadora?.nome} {selectedVehicle.modelo?.nome}
            </h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {selectedVehicle.km?.toLocaleString()} KM
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                {selectedVehicle.transmissao}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                {selectedVehicle.combustivel}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl animate-in slide-in-from-bottom-3">
      <div className="flex items-center justify-between mb-4 ml-1">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscar Veículo em Estoque</label>
        {isChanging && (
          <button
            onClick={() => { setIsChanging(false); setSearchTerm(''); }}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
      <div className="space-y-4">
        <input
          autoFocus={isChanging}
          type="text"
          disabled={disabled}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Digite placa, montadora ou modelo..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />

        <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
          {filteredVehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Nenhum veículo encontrado</p>
            </div>
          ) : (
            filteredVehicles.map((v: any) => (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(v.id)}
                className="w-full text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0">
                    {v.fotos?.[0]?.url ? (
                      <img src={v.fotos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate">
                        {v.montadora?.nome || 'Montadora'}
                      </p>
                      <span className="text-[9px] font-black text-slate-700 bg-slate-200/50 px-2 py-0.5 rounded uppercase tracking-widest">
                        {v.placa || 'SEM PLACA'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 truncate">
                      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">
                        {v.modelo?.nome || 'Modelo'}
                      </h4>
                      {v.versao?.nome && (
                        <span className="text-[10px] font-bold text-slate-400 truncate border-l border-slate-200 pl-2 leading-none">
                          {v.versao.nome}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">KM: {(v.km || 0).toLocaleString('pt-BR')}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Motor: {v.motorizacao || 'N/D'}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketingVehicleSelection;
