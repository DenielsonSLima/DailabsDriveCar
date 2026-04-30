import React from 'react';
import { IDebitoFiltros, SortFieldDebito, SortOrder } from '../outros-debitos.types';

interface Props {
  filtros: IDebitoFiltros;
  onChange: (newFiltros: IDebitoFiltros) => void;
  sortBy: SortFieldDebito;
  setSortBy: (val: SortFieldDebito) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  viewMode: 'list' | 'card';
  setViewMode: (mode: 'list' | 'card') => void;
}

const DebitosFilters: React.FC<Props> = ({ filtros, onChange, sortBy, setSortBy, sortOrder, setSortOrder, viewMode, setViewMode }) => {
  const handleChange = (field: keyof IDebitoFiltros, value: string) => {
    onChange({ ...filtros, [field]: value });
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-6 items-end">

        <div className="flex-1 w-full relative">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Pesquisar Débito</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Ex: Empréstimo, Financiamento, Devolução..."
              value={filtros.busca}
              onChange={(e) => handleChange('busca', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="w-full xl:w-auto">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Período</label>
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-2xl p-1">
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={e => handleChange('dataInicio', e.target.value)}
              className="bg-transparent text-xs font-bold text-[#111827] px-3 py-2 outline-none cursor-pointer"
            />
            <span className="text-slate-300 font-bold text-[10px]">ATÉ</span>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={e => handleChange('dataFim', e.target.value)}
              className="bg-transparent text-xs font-bold text-[#111827] px-3 py-2 outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="w-full xl:w-auto">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Visualização</label>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Lista">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button onClick={() => setViewMode('card')} className={`p-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Cards">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
          </div>
        </div>

        <div className="w-full xl:w-auto">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Organizar por</label>
          <div className="flex bg-slate-100 p-1 rounded-2xl items-center">
            <button onClick={() => setSortBy('alfabeto')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'alfabeto' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Alfabeto</button>
            <button onClick={() => setSortBy('data')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'data' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Data</button>
            <button onClick={() => setSortBy('valor')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'valor' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Valor</button>

            <div className="w-[1px] h-4 bg-slate-200 mx-1" />

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white transition-all flex items-center justify-center"
              title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            >
              <svg className={`w-4 h-4 transition-transform duration-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebitosFilters;
