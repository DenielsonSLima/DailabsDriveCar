
import React from 'react';
import { IParceirosStats, ParceiroTab } from '../parceiros.types';

interface FiltersProps {
  activeTab: ParceiroTab;
  setActiveTab: (tab: ParceiroTab) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  stats: IParceirosStats;
}

const ParceirosFilters: React.FC<FiltersProps> = ({ activeTab, setActiveTab, searchTerm, setSearchTerm, stats }) => {
  const tabs: { id: ParceiroTab; label: string }[] = [
    { id: 'ativos', label: 'Ativos' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'fornecedores', label: 'Fornecedores' },
    { id: 'inativos', label: 'Inativos' },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      {/* Abas */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-5 py-2.5 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all whitespace-nowrap ${activeTab === tab.id
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
              {stats[tab.id as keyof IParceirosStats]}
            </span>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative w-full md:w-96">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Buscar por nome, documento ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
        />
      </div>
    </div>
  );
};

export default ParceirosFilters;
