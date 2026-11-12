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
    <div className="dc-filterbar bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row gap-4 items-end">

        {/* Busca por Descrição / Documento */}
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Pesquisa Rápida</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Descrição ou documento de referência..."
              value={filtros.busca}
              onChange={(e) => handleChange('busca', e.target.value)}
              className="dc-input w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-[#111827] focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Período de Vencimento */}
        <div className="w-full xl:w-auto">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Período de Vencimento</label>
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1 shadow-inner">
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={e => handleChange('dataInicio', e.target.value)}
              className="dc-input bg-transparent text-xs font-medium text-[#111827] px-3 py-2 outline-none cursor-pointer"
            />
            <span className="text-slate-300 font-medium text-xs">ATÉ</span>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={e => handleChange('dataFim', e.target.value)}
              className="dc-input bg-transparent text-xs font-medium text-[#111827] px-3 py-2 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Categoria */}
        <div className="w-full xl:w-48">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Plano de Contas</label>
          <select
            value={filtros.categoriaId}
            onChange={e => handleChange('categoriaId', e.target.value)}
            className="dc-input w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
          >
            <option value="">Todas Categorias</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        {/* Status */}
        <div className="w-full xl:w-48">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Situação</label>
          <select
            value={filtros.status}
            onChange={e => handleChange('status', e.target.value)}
            className="dc-input w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
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
          className="dc-button px-4 py-3 bg-slate-100 text-slate-400 text-xs font-semibold normal-case tracking-normal rounded-xl hover:bg-slate-200 transition-all active:scale-100 flex items-center shrink-0"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default PagarFilters;
