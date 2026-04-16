
import React, { useState, useEffect, useMemo } from 'react';
import { IModelo } from '../../modelos/modelos.types';
import { IVersao } from '../versoes.types';
import { VersoesService } from '../versoes.service';
import VersionForm from './VersionForm';
import ConfirmModal from '../../../../components/ConfirmModal';

interface Props {
  modelo: IModelo;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 8;

const VersionManager: React.FC<Props> = ({ modelo, onBack }) => {
  const [versoes, setVersoes] = useState<IVersao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVersao, setEditingVersao] = useState<IVersao | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [displayStatus, setDisplayStatus] = useState<'active' | 'inactive'>('active');

  // Inativação
  const [inactivateId, setInactivateId] = useState<string | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    // Buscamos apenas ativos ou apenas inativos dependendo da aba
    const data = await VersoesService.getByModelo(modelo.id, displayStatus === 'active');
    setVersoes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const sub = VersoesService.subscribe(modelo.id, () => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [modelo.id, displayStatus]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Lista de anos únicos para o filtro
  const availableYears = useMemo(() => {
    const years = versoes.map(v => v.ano_modelo.toString());
    return Array.from(new Set(years)).sort((a: string, b: string) => b.localeCompare(a));
  }, [versoes]);

  // Lógica de Filtro Combinada
  const filteredVersoes = useMemo(() => {
    return versoes.filter(v => {
      const matchesSearch = v.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            v.motorizacao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear ? v.ano_modelo.toString() === filterYear : true;
      return matchesSearch && matchesYear;
    });
  }, [versoes, searchTerm, filterYear]);

  const totalPages = Math.ceil(filteredVersoes.length / ITEMS_PER_PAGE);
  const paginatedVersoes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVersoes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVersoes, currentPage]);

  const handleSubmit = async (data: Partial<IVersao>) => {
    setIsSaving(true);
    try {
      await VersoesService.save({ ...data, modelo_id: modelo.id });
      setIsFormOpen(false);
      showToast('success', data.id ? 'Variante atualizada com sucesso!' : 'Nova versão cadastrada com sucesso!');
      loadData(true);
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao processar solicitação.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickInactivate = (id: string) => {
    setInactivateId(id);
  };

  const handleConfirmInactivate = async () => {
    if (!inactivateId) return;
    setIsInactivating(true);
    try {
      await VersoesService.remove(inactivateId);
      showToast('success', 'Variante inativada com sucesso!');
      loadData(true);
      setInactivateId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao inativar variante.');
    } finally {
      setIsInactivating(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await VersoesService.reactivate(id);
      showToast('success', 'Variante reativada com sucesso!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao reativar variante.');
    }
  };

  const handleDuplicate = (v: IVersao) => {
    const { id, created_at, updated_at, ...rest } = v;
    setEditingVersao({ ...rest } as IVersao);
    setIsFormOpen(true);
    showToast('success', 'Dados copiados! Ajuste as diferenças.');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-500 pb-20">
      {/* Toast Notificação */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-rose-600'}`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-black text-[10px] uppercase tracking-widest opacity-60 leading-none mb-1">Notificação</p>
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-4 min-w-0">
          <button 
            onClick={onBack} 
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shrink-0 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="h-8 w-px bg-slate-100 shrink-0"></div>

          <div className="flex items-center space-x-3 min-w-0">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 border border-slate-100 shadow-inner shrink-0 overflow-hidden">
                {modelo.montadora?.logo_url && (
                   <img src={modelo.montadora.logo_url} className="max-h-full max-w-full object-contain" alt="" />
                )}
             </div>
             <div className="truncate">
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none truncate">{modelo.nome}</h2>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">Gerenciamento de Versões</p>
             </div>
          </div>
        </div>

        <button 
          onClick={() => { setEditingVersao(null); setIsFormOpen(true); }}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center shrink-0 ml-4"
        >
          <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Versão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado Esquerdo: Info Veículo */}
        <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-900 flex items-center justify-center relative overflow-hidden h-[380px]">
               {modelo.foto_url ? (
                 <img src={modelo.foto_url} className="object-contain transition-transform duration-700 opacity-95 w-[380px] h-[380px]" alt={modelo.nome} />
               ) : (
                 <div className="flex flex-col items-center justify-center text-slate-700 uppercase font-black tracking-widest text-[10px] space-y-3">
                    <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Sem Foto</span>
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent"></div>
               <div className="absolute bottom-6 left-8 text-white pr-8">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">{modelo.montadora?.nome}</p>
                  <h3 className="text-4xl font-black uppercase tracking-tighter leading-tight break-words">{modelo.nome}</h3>
               </div>
            </div>

            <div className="p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-2 shadow-inner overflow-hidden">
                      {modelo.montadora?.logo_url && (
                        <img src={modelo.montadora.logo_url} className="max-h-full max-w-full object-contain" alt="" />
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Fabricante</p>
                      <h4 className="text-sm font-black text-slate-900 uppercase mt-1">{modelo.montadora?.nome}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Versões</p>
                    <p className="text-xl font-black text-indigo-600 mt-1">{versoes.length}</p>
                  </div>
               </div>
               <div className="h-px bg-slate-50"></div>
               <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic text-center">
                    Gerencie os acabamentos para propostas e catálogo.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Lista e Filtros */}
        <div className="lg:col-span-8 xl:col-span-8 min-w-0">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 shadow-sm min-h-[600px] flex flex-col overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 border-b border-slate-50 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center shrink-0">
                  <span className={`w-2 h-7 rounded-full mr-4 ${displayStatus === 'active' ? 'bg-indigo-600' : 'bg-rose-500'}`}></span>
                  {displayStatus === 'active' ? 'Variantes Ativas' : 'Variantes Inativas'}
                </h3>

                {/* Tab Selector */}
                <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                  <button
                    onClick={() => setDisplayStatus('active')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${displayStatus === 'active'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Ativos
                  </button>
                  <button
                    onClick={() => setDisplayStatus('inactive')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${displayStatus === 'inactive'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Inativos
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:max-w-xl">
                {/* Filtro por Ano */}
                <select 
                  value={filterYear}
                  onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-32 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer appearance-none text-center"
                >
                  <option value="">Todos os Anos</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {/* Busca por Nome/Modelo */}
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Pesquisar por modelo ou versão..." 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-100 border-transparent rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {loading ? (
                <div className="py-24 flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : filteredVersoes.length === 0 ? (
                <div className="py-32 text-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   </div>
                   <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Nenhuma variante encontrada para os filtros.</p>
                </div>
              ) : (
                paginatedVersoes.map(v => (
                  <div key={v.id} className="group bg-white border border-slate-100 hover:border-indigo-100 rounded-[1.8rem] p-5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-lg overflow-hidden">
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="min-w-0 md:w-56">
                        <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Acabamento</p>
                        <h4 className="font-black text-slate-900 uppercase tracking-tighter text-lg truncate group-hover:text-indigo-600 transition-colors" title={v.nome}>{v.nome}</h4>
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                          <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Propulsão</p>
                          <p className="text-[10px] font-black text-slate-700 truncate">{v.motorizacao} • {v.combustivel}</p>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                          <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Câmbio</p>
                          <p className="text-[10px] font-black text-slate-700 truncate">{v.transmissao}</p>
                        </div>
                        <div className="bg-indigo-50/50 px-3 py-1.5 rounded-xl text-center min-w-[75px]">
                          <p className="text-[7px] font-black text-indigo-400 uppercase mb-0.5">Ano/Mod</p>
                          <div className="text-indigo-700 text-[10px] font-black">{v.ano_fabricacao}/{v.ano_modelo}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-all">
                      {displayStatus === 'active' ? (
                        <>
                          <button onClick={() => handleDuplicate(v)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Duplicar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                          </button>
                          <button onClick={() => { setEditingVersao(v); setIsFormOpen(true); }} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Editar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleClickInactivate(v.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm" title="Inativar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleReactivate(v.id)} className="p-2.5 bg-white text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Reativar">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center space-x-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg border border-slate-100 disabled:opacity-20 hover:bg-slate-50"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-7 h-7 rounded-lg text-[9px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{i + 1}</button>
                  ))}
                </div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg border border-slate-100 disabled:opacity-20 hover:bg-slate-50"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <VersionForm 
          initialData={editingVersao}
          isSaving={isSaving}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal 
        isOpen={!!inactivateId}
        onClose={() => setInactivateId(null)}
        onConfirm={handleConfirmInactivate}
        title="Inativar Variante?"
        message={`Deseja inativar a versão "${versoes.find(v => v.id === inactivateId)?.nome}"? Ela não aparecerá mais para inclusão em estoque.`}
        confirmText="Sim, Inativar"
        variant="warning"
        isLoading={isInactivating}
      />
    </div>
  );
};

export default VersionManager;
