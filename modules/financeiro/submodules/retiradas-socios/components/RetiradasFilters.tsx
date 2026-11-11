
import React from 'react';
import { IRetiradaFiltros, GroupByRetirada } from '../retiradas.types';

interface Props {
  filtros: IRetiradaFiltros;
  onChange: (f: IRetiradaFiltros) => void;
  socios: any[];
  groupBy: GroupByRetirada;
  setGroupBy: (g: GroupByRetirada) => void;
}

const RetiradasFilters: React.FC<Props> = ({ filtros, onChange, socios, groupBy, setGroupBy }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row gap-6 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Busca por Descrição</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Pesquisar histórico..."
              value={filtros.busca}
              onChange={e => onChange({ ...filtros, busca: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-[#111827] focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="w-full xl:w-56">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Por Sócio</label>
          <select
            value={filtros.socioId}
            onChange={e => onChange({ ...filtros, socioId: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-medium text-[#111827] outline-none appearance-none"
          >
            <option value="">Todos os Sócios</option>
            {socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>

        <div className="w-full xl:w-auto">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Agrupar Visão</label>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setGroupBy('nenhum')} className={`px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'nenhum' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
            <button onClick={() => setGroupBy('mes')} className={`px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'mes' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
            <button onClick={() => setGroupBy('socio')} className={`px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'socio' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sócio</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetiradasFilters;
