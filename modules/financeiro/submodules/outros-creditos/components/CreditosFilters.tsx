import React from 'react';
import { ICreditoFiltros, GroupByCredito } from '../outros-creditos.types';

interface Props {
  filtros: ICreditoFiltros;
  onChange: (newFiltros: ICreditoFiltros) => void;
  groupBy: GroupByCredito;
  setGroupBy: (val: GroupByCredito) => void;
}

const CreditosFilters: React.FC<Props> = ({ filtros, onChange, groupBy, setGroupBy }) => {
  const handleChange = (field: keyof ICreditoFiltros, value: string) => {
    onChange({ ...filtros, [field]: value });
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-6 items-end">

        <div className="flex-1 w-full relative">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Pesquisar Crédito</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Ex: Aporte Sócio, Rendimento CDI..."
              value={filtros.busca}
              onChange={(e) => handleChange('busca', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
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
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Organizar por</label>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setGroupBy('nenhum')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${groupBy === 'nenhum' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
            <button onClick={() => setGroupBy('mes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${groupBy === 'mes' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
            <button onClick={() => setGroupBy('conta')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${groupBy === 'conta' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Conta</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditosFilters;
