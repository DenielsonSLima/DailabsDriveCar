import React from 'react';
import { IVariaveisFiltros, GroupByVariavel } from '../despesas-variaveis.types';

interface Props {
  filtros: IVariaveisFiltros;
  onChange: (newFiltros: IVariaveisFiltros) => void;
  categorias: any[];
  groupBy: GroupByVariavel;
  setGroupBy: (val: GroupByVariavel) => void;
}

const VariaveisFilters: React.FC<Props> = ({ filtros, onChange, categorias, groupBy, setGroupBy }) => {
  const handleChange = (field: keyof IVariaveisFiltros, value: string) => {
    onChange({ ...filtros, [field]: value });
  };

  return (
    <div className="dc-filterbar bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row gap-4 items-end">

        <div className="flex-1 w-full relative">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Pesquisa</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Descrição ou nota..."
              value={filtros.busca}
              onChange={(e) => handleChange('busca', e.target.value)}
              className="dc-input w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-[#111827] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="w-full xl:w-48">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Categoria</label>
          <select
            value={filtros.categoriaId}
            onChange={e => handleChange('categoriaId', e.target.value)}
            className="dc-input w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-[#111827] outline-none cursor-pointer appearance-none"
          >
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="w-full xl:w-auto">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Agrupar por</label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setGroupBy('nenhum')} className={`dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'nenhum' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
            <button onClick={() => setGroupBy('mes')} className={`dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'mes' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
            <button onClick={() => setGroupBy('categoria')} className={`dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'categoria' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Categoria</button>
          </div>
        </div>

        <button
          onClick={() => onChange({ busca: '', dataInicio: '', dataFim: '', categoriaId: '', status: '' })}
          className="dc-button px-4 py-3 bg-slate-100 text-slate-400 text-xs font-semibold normal-case tracking-normal rounded-xl hover:bg-slate-200 transition-all active:scale-100"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

export default VariaveisFilters;
