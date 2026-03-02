
import React from 'react';
import { IMontadora } from '../../cadastros/montadoras/montadoras.types';
import { ITipoVeiculo } from '../../cadastros/tipos-veiculos/tipos-veiculos.types';

export type GroupByOption = 'none' | 'montadora' | 'tipo';

interface Props {
  montadoras: IMontadora[];
  tipos: ITipoVeiculo[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterMontadora: string;
  setFilterMontadora: (id: string) => void;
  filterTipo: string;
  setFilterTipo: (id: string) => void;
  groupBy: GroupByOption;
  setGroupBy: (g: GroupByOption) => void;
}

const EstoqueFilters: React.FC<Props> = ({
  montadoras, tipos,
  searchTerm, setSearchTerm,
  filterMontadora, setFilterMontadora,
  filterTipo, setFilterTipo,
  groupBy, setGroupBy
}) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-6 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

      <div className="flex-1 relative min-w-[280px]">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Buscar por modelo, placa ou versão..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:font-medium text-[#111827]"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center overflow-x-auto pb-1 xl:pb-0">
        <div className="w-full md:w-48">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Montadora</label>
          <select
            value={filterMontadora}
            onChange={(e) => setFilterMontadora(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-[#111827]"
          >
            <option value="">Todas</option>
            {montadoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Categoria</label>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-[#111827]"
          >
            <option value="">Todas</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>

        <div className="w-px h-10 bg-slate-100 hidden md:block mx-2"></div>

        <div className="flex flex-col w-full md:w-auto">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Agrupar Visualização</label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setGroupBy('none')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${groupBy === 'none' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Lista
            </button>
            <button
              onClick={() => setGroupBy('montadora')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${groupBy === 'montadora' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Marca
            </button>
            <button
              onClick={() => setGroupBy('tipo')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${groupBy === 'tipo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Tipo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstoqueFilters;
