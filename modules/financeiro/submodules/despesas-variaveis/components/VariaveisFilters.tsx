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
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-6 items-end">

        <div className="flex-1 w-full relative">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Pesquisa</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Descrição ou nota..."
              value={filtros.busca}
              onChange={(e) => handleChange('busca', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="w-full xl:w-48">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Categoria</label>
          <select
            value={filtros.categoriaId}
            onChange={e => handleChange('categoriaId', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-[#111827] outline-none cursor-pointer appearance-none"
          >
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div className="w-full xl:w-auto">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Agrupar por</label>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setGroupBy('nenhum')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${groupBy === 'nenhum' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lista</button>
            <button onClick={() => setGroupBy('mes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${groupBy === 'mes' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
            <button onClick={() => setGroupBy('categoria')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${groupBy === 'categoria' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Categoria</button>
          </div>
        </div>

        <button
          onClick={() => onChange({ busca: '', dataInicio: '', dataFim: '', categoriaId: '', status: '' })}
          className="px-6 py-3 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

export default VariaveisFilters;
