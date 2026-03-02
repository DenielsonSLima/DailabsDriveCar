import React from 'react';
import { IPagarFiltros } from '../contas-pagar.types';

interface Props {
  filtros: IPagarFiltros;
  onChange: (newFiltros: IPagarFiltros) => void;
  categorias: any[];
}

const PagarFilters: React.FC<Props> = ({ filtros, onChange, categorias }) => {
  const handleChange = (field: keyof IPagarFiltros, value: string) => {
    onChange({ ...filtros, [field]: value });
  };

  const handleClear = () => {
    onChange({
      busca: '',
      dataInicio: '',
      dataFim: '',
      categoriaId: '',
      status: ''
    });
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-6 items-end">

        {/* Busca por Descrição / Documento */}
        <div className="flex-1 w-full relative">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Pesquisa Rápida</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Descrição ou documento de referência..."
              value={filtros.busca}
              onChange={(e) => handleChange('busca', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Período de Vencimento */}
        <div className="w-full xl:w-auto">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Período de Vencimento</label>
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-2xl p-1 shadow-inner">
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

        {/* Categoria */}
        <div className="w-full xl:w-48">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Plano de Contas</label>
          <select
            value={filtros.categoriaId}
            onChange={e => handleChange('categoriaId', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
          >
            <option value="">Todas Categorias</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        {/* Status */}
        <div className="w-full xl:w-48">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Situação</label>
          <select
            value={filtros.status}
            onChange={e => handleChange('status', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
          >
            <option value="">Todos Status</option>
            <option value="PENDENTE">Apenas Pendentes</option>
            <option value="PARCIAL">Pagos Parcialmente</option>
            <option value="PAGO">Liquidados (Pagos)</option>
            <option value="ATRASADO">Vencidos (Atraso)</option>
          </select>
        </div>

        <button
          onClick={handleClear}
          className="px-6 py-3 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95 flex items-center shrink-0"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default PagarFilters;
