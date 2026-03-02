
import React from 'react';
import { IPedidoFiltros } from '../pedidos-compra.types';
import { ISocio } from '../../ajustes/socios/socios.types';
import { ICorretor } from '../../cadastros/corretores/corretores.types';

interface Props {
  filtros: IPedidoFiltros;
  onChange: (newFiltros: IPedidoFiltros) => void;
  socios: ISocio[];
  corretores: ICorretor[];
}

const PedidosFilters: React.FC<Props> = ({ filtros, onChange, socios = [], corretores = [] }) => {

  const handleChange = (field: keyof IPedidoFiltros, value: string) => {
    onChange({ ...filtros, [field]: value });
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col xl:flex-row gap-6">

        {/* Busca Textual */}
        <div className="flex-1 relative min-w-[280px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar pedido, veículo ou fornecedor..."
            value={filtros.busca}
            onChange={(e) => handleChange('busca', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:font-medium text-[#111827]"
          />
        </div>

        {/* Filtros em Linha */}
        <div className="flex flex-col md:flex-row gap-4 items-center overflow-x-auto pb-1 xl:pb-0">

          {/* Período */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1">
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => handleChange('dataInicio', e.target.value)}
              className="bg-white text-xs font-bold text-[#111827] outline-none px-2 py-1.5 cursor-pointer"
              title="Data Início"
            />
            <span className="text-slate-300">-</span>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => handleChange('dataFim', e.target.value)}
              className="bg-white text-xs font-bold text-[#111827] outline-none px-2 py-1.5 cursor-pointer"
              title="Data Fim"
            />
          </div>

          <div className="w-px h-10 bg-slate-100 hidden md:block mx-2"></div>

          {/* Sócio */}
          <div className="w-full md:w-48">
            <select
              value={filtros.socioId}
              onChange={(e) => handleChange('socioId', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-[#111827]"
            >
              <option value="">Todos os Sócios</option>
              {socios.map(s => <option key={s.id} value={s.id!}>{s.nome}</option>)}
            </select>
          </div>

          {/* Corretor */}
          <div className="w-full md:w-48">
            <select
              value={filtros.corretorId}
              onChange={(e) => handleChange('corretorId', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-[#111827]"
            >
              <option value="">Todos Corretores</option>
              {corretores.map(c => <option key={c.id} value={c.id}>{c.nome} {c.sobrenome}</option>)}
            </select>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PedidosFilters;
