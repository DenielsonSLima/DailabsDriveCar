import React from 'react';
import { IContaBancaria } from '../../../../ajustes/contas-bancarias/contas.types';

interface Props {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  dateStart: string;
  setDateStart: (val: string) => void;
  dateEnd: string;
  setDateEnd: (val: string) => void;
  selectedAccountId: string;
  setSelectedAccountId: (val: string) => void;
  groupBy: 'nenhum' | 'mes' | 'conta';
  setGroupBy: (val: 'nenhum' | 'mes' | 'conta') => void;
  contas: IContaBancaria[];
  showGrouping: boolean;
}

const TransferFilters: React.FC<Props> = ({
  searchTerm, setSearchTerm,
  dateStart, setDateStart,
  dateEnd, setDateEnd,
  selectedAccountId, setSelectedAccountId,
  groupBy, setGroupBy,
  contas,
  showGrouping
}) => {
  return (
    <div className="dc-filterbar bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row gap-4 items-end">
        {/* Busca */}
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Pesquisar</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Descrição ou valor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Período */}
        <div className="w-full xl:w-auto">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Período</label>
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <input 
              type="date" 
              value={dateStart} 
              onChange={e => setDateStart(e.target.value)}
              className="dc-input bg-transparent text-xs font-medium text-slate-600 px-3 py-2 outline-none cursor-pointer"
            />
            <span className="text-slate-300 font-medium text-xs">ATÉ</span>
            <input 
              type="date" 
              value={dateEnd} 
              onChange={e => setDateEnd(e.target.value)}
              className="dc-input bg-transparent text-xs font-medium text-slate-600 px-3 py-2 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Banco */}
        <div className="w-full xl:w-56">
          <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Filtrar por Conta</label>
          <select 
            value={selectedAccountId} 
            onChange={e => setSelectedAccountId(e.target.value)}
            className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
          >
            <option value="">Todas as Contas</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} - {c.titular}</option>)}
          </select>
        </div>

        {/* Agrupamento (Apenas se showGrouping) */}
        {showGrouping && (
          <div className="w-full xl:w-auto">
            <label className="block text-xs font-medium text-slate-500 normal-case mb-1.5 ml-1 tracking-normal">Agrupar por</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setGroupBy('nenhum')}
                className={`dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'nenhum' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Lista
              </button>
              <button 
                onClick={() => setGroupBy('mes')}
                className={`dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'mes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Mês
              </button>
              <button 
                onClick={() => setGroupBy('conta')}
                className={`dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case transition-all ${groupBy === 'conta' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferFilters;