
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModelosService } from '../modelos/modelos.service';
import { IModelo } from '../modelos/modelos.types';
import { MontadorasService } from '../montadoras/montadoras.service';
import { TiposVeiculosService } from '../tipos-veiculos/tipos-veiculos.service';
import { IMontadora } from '../montadoras/montadoras.types';
import { ITipoVeiculo } from '../tipos-veiculos/tipos-veiculos.types';
import VersionManager from './components/VersionManager';

type GroupBy = 'montadora' | 'tipo' | 'nenhum';

const VersoesPage: React.FC = () => {
  const navigate = useNavigate();
  const [modelos, setModelos] = useState<(IModelo & { versoes_count: number })[]>([]);
  const [montadoras, setMontadoras] = useState<IMontadora[]>([]);
  const [tipos, setTipos] = useState<ITipoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelo, setSelectedModelo] = useState<IModelo | null>(null);
  
  // Filtros e Agrupamento
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMontadora, setFilterMontadora] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('montadora');

  const [displayStatus, setDisplayStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    loadInitialData();
  }, [displayStatus]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [mRes, mtRes, tRes] = await Promise.all([
        ModelosService.getAll(displayStatus === 'active'),
        MontadorasService.getAll(true),
        TiposVeiculosService.getAll(true)
      ]);
      setModelos(mRes);
      setMontadoras(mtRes);
      setTipos(tRes);
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo<Record<string, (IModelo & { versoes_count: number })[]>>(() => {
    // 1. Filtragem
    const filtered = modelos.filter(m => {
      const matchSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.montadora?.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMontadora = filterMontadora ? m.montadora_id === filterMontadora : true;
      const matchTipo = filterTipo ? m.tipo_veiculo_id === filterTipo : true;
      return matchSearch && matchMontadora && matchTipo;
    });

    // 2. Agrupamento
    if (groupBy === 'nenhum') return { 'Todos os Modelos': filtered };

    return filtered.reduce((acc: Record<string, (IModelo & { versoes_count: number })[]>, m) => {
      const key = groupBy === 'montadora' 
        ? (m.montadora?.nome || 'Sem Montadora') 
        : (m.tipo_veiculo?.nome || 'Sem Categoria');
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {} as Record<string, (IModelo & { versoes_count: number })[]>);
  }, [modelos, searchTerm, filterMontadora, filterTipo, groupBy]);

  if (selectedModelo) {
    return (
      <VersionManager 
        modelo={selectedModelo} 
        onBack={() => {
          setSelectedModelo(null);
          window.scrollTo(0, 0);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Versões Comerciais</h1>
          <p className="text-slate-500 mt-1">Gerencie os pacotes e acabamentos vinculados a cada modelo.</p>
        </div>
      </div>

      {/* Toolbar de Filtros e Agrupamento */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative">
           <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Buscar modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* Tab Selector */}
          <div className="flex flex-col">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Status do Modelo</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setDisplayStatus('active')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${displayStatus === 'active'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setDisplayStatus('inactive')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${displayStatus === 'inactive'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                Inativos
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Montadora</label>
            <select 
              value={filterMontadora} 
              onChange={(e) => setFilterMontadora(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Todas</option>
              {montadoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Agrupar por</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setGroupBy('montadora')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${groupBy === 'montadora' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Marca
              </button>
              <button 
                onClick={() => setGroupBy('tipo')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${groupBy === 'tipo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Tipo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Conteúdo */}
      <div className="space-y-10 min-h-[600px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Organizando catálogo...</p>
          </div>
        ) : Object.keys(processedData).length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-200 border-dashed">
            <p className="text-slate-400 font-medium italic">Nenhum modelo encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          Object.entries(processedData).map(([groupName, groupItems]) => {
            const items = groupItems as (IModelo & { versoes_count: number })[];
            return (
              <div key={groupName} className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-4 mb-6">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter border-l-4 border-indigo-600 pl-4">
                    {groupName}
                    <span className="ml-2 text-xs font-normal text-slate-400">({items.length} modelos)</span>
                  </h3>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map(m => (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedModelo(m)}
                      className="group bg-white border border-slate-200 rounded-[2rem] p-4 cursor-pointer hover:shadow-2xl hover:border-indigo-400 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="aspect-video bg-slate-50 rounded-2xl mb-4 overflow-hidden relative">
                        {m.foto_url ? (
                          <img src={m.foto_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={m.nome} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200 italic text-[10px] uppercase font-bold tracking-widest">Sem Imagem</div>
                        )}
                        
                        {/* Badge Contador de Versões */}
                        <div className="absolute top-3 right-3">
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center space-x-1.5 ${m.versoes_count > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                            <span>{m.versoes_count}</span>
                            <span className="text-[8px] opacity-80">{m.versoes_count === 1 ? 'Versão' : 'Versões'}</span>
                          </div>
                        </div>

                        {/* Badge Tipo (se não agrupado por tipo) */}
                        {groupBy !== 'tipo' && m.tipo_veiculo && (
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm">
                              {m.tipo_veiculo.nome}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center p-1.5 border border-slate-100 shadow-inner">
                          {m.montadora?.logo_url ? (
                            <img src={m.montadora.logo_url} className="max-h-full max-w-full object-contain" alt={m.montadora.nome} />
                          ) : (
                            <span className="text-[10px] font-black text-slate-400">{m.montadora?.nome.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 uppercase tracking-tighter leading-tight truncate">{m.nome}</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{m.montadora?.nome}</p>
                        </div>
                        <div className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VersoesPage;
