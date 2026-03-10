import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EstoqueService } from './estoque.service';
import { IVeiculo } from './estoque.types';
import { MontadorasService } from '../cadastros/montadoras/montadoras.service';
import { TiposVeiculosService } from '../cadastros/tipos-veiculos/tipos-veiculos.service';
import { CoresService } from '../cadastros/cores/cores.service';
import { SociosService } from '../ajustes/socios/socios.service';
import { EmpresaService } from '../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios/relatorios.service';

// PDF Components
import RelatoriosQuickPreview from '../relatorios/components/RelatoriosQuickPreview';
import EstoqueComSociosTemplate from '../relatorios/templates/estoque/EstoqueComSociosTemplate';

// Componentes do Dashboard e Listagem
import EstoqueDashboard from './components/EstoqueDashboard';
import EstoqueFilters, { GroupByOption } from './components/EstoqueFilters';
import EstoqueList from './components/EstoqueList';

const EstoquePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Paginação e Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [activeTab, setActiveTab] = useState<'DISPONIVEL' | 'RASCUNHO' | 'TODOS'>('DISPONIVEL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMontadora, setFilterMontadora] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');

  // Relatório PDF
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries de Catálogos (Dependencies)
  const { data: montadoras = [] } = useQuery({ queryKey: ['montadoras'], queryFn: () => MontadorasService.getAll() });
  const { data: tipos = [] } = useQuery({ queryKey: ['tipos_veiculos'], queryFn: () => TiposVeiculosService.getAll() });
  const { data: cores = [] } = useQuery({ queryKey: ['cores'], queryFn: () => CoresService.getAll() });
  const { data: socios = [] } = useQuery({ queryKey: ['socios'], queryFn: () => SociosService.getAll() });

  // Carregar dados da empresa e marca d'água para o PDF
  useEffect(() => {
    EmpresaService.getDadosEmpresa().then(setEmpresa);
    MarcaDaguaService.getConfig().then(setWatermark);
  }, []);


  // Query Principal (Lista)
  const filters = useMemo(() => ({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchTerm,
    montadoraId: filterMontadora || undefined,
    tipoId: filterTipo || undefined,
    statusTab: activeTab
  }), [currentPage, searchTerm, filterMontadora, filterTipo, activeTab]);

  const { data: response, isLoading: isLoadingList } = useQuery({
    queryKey: ['estoque_list', filters],
    queryFn: () => EstoqueService.getAll(filters),
  });

  // Query de Estatísticas
  const { data: statsDashboard } = useQuery({
    queryKey: ['estoque_stats', filters],
    queryFn: () => EstoqueService.getDashboardStats(filters),
  });

  useEffect(() => {
    const subscription = EstoqueService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['estoque_list'] });
      queryClient.invalidateQueries({ queryKey: ['estoque_stats'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMontadora, filterTipo, activeTab]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (response?.totalPages || 1)) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const veiculos = response?.data || [];
  const totalPages = response?.totalPages || 1;
  const totalCount = response?.count || 0;

  // Agrupamento (Visual apenas na página atual)
  const processedData = useMemo(() => {
    if (groupBy === 'none') return veiculos;
    return veiculos.reduce((acc: { [key: string]: IVeiculo[] }, v) => {
      let key = 'Outros';
      const vFull = v as any;
      if (groupBy === 'montadora') key = vFull.montadora?.nome || 'Sem Montadora';
      else if (groupBy === 'tipo') key = vFull.tipo_veiculo?.nome || 'Sem Categoria';
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    }, {});
  }, [veiculos, groupBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Estoque de Veículos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie seu inventário e analise a participação societária.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setIsGenerating(true);
              try {
                const veiculosRaw = await RelatoriosService.getEstoqueParaRelatorio(activeTab === 'TODOS' ? 'TODOS' : 'DISPONIVEL');

                const veiculos = veiculosRaw.map((v: any) => ({
                  id: v.id,
                  placa: v.placa || '—',
                  montadora: v.montadora?.nome || 'N/I',
                  modelo: v.modelo?.nome || '—',
                  versao: v.versao?.nome || '—',
                  socios: (v.socios || []).map((s: any) => ({
                    nome: s.nome,
                    valor: Number(s.valor || 0)
                  }))
                }));

                const totalEstoque = veiculosRaw.reduce((acc: number, v: any) => acc + Number(v.valor_custo || 0) + Number(v.valor_custo_servicos || 0), 0);
                const volumeVeiculos = veiculosRaw.length;

                const partnerMap = new Map();
                veiculosRaw.forEach((v: any) => {
                  (v.socios || []).forEach((s: any) => {
                    const val = Number(s.valor || 0);
                    if (!partnerMap.has(s.nome)) {
                      partnerMap.set(s.nome, { nome: s.nome, valor: 0, veiculosCount: 0 });
                    }
                    const p = partnerMap.get(s.nome);
                    p.valor += val;
                    p.veiculosCount += 1;
                  });
                });

                const partnerGlobalStats = Array.from(partnerMap.values()).map(p => ({
                  ...p,
                  porcentagem: totalEstoque > 0 ? (p.valor / totalEstoque) * 100 : 0
                })).sort((a: any, b: any) => b.valor - a.valor);

                setReportData({
                  totalEstoque,
                  volumeVeiculos,
                  partnerGlobalStats,
                  veiculos
                });
                setIsPreviewOpen(true);
              } catch (err) {
                console.error('Erro ao gerar relatório:', err);
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            )}
            <span>Emitir PDF Estoque</span>
          </button>
        </div>
      </div>

      <EstoqueDashboard stats={statsDashboard} socios={socios} />

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('DISPONIVEL')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'DISPONIVEL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Disponíveis</button>
        <button onClick={() => setActiveTab('RASCUNHO')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'RASCUNHO' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Em Preparação</button>
        <button onClick={() => setActiveTab('TODOS')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'TODOS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Todos</button>
      </div>

      <EstoqueFilters
        montadoras={montadoras} tipos={tipos}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filterMontadora={filterMontadora} setFilterMontadora={setFilterMontadora}
        filterTipo={filterTipo} setFilterTipo={setFilterTipo}
        groupBy={groupBy} setGroupBy={setGroupBy}
      />

      {isLoadingList ? (
        <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <>
          <EstoqueList
            groupedData={processedData}
            isGrouped={groupBy !== 'none'}
            cores={cores}
            onDelete={() => { }}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages}</span>
                <span className="ml-2 opacity-50">({totalCount} veículos)</span>
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex space-x-1">
                  {currentPage > 2 && <span className="px-2 py-2 text-slate-300">...</span>}
                  {currentPage > 1 && (
                    <button onClick={() => handlePageChange(currentPage - 1)} className="w-10 h-10 rounded-xl text-xs font-black bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                      {currentPage - 1}
                    </button>
                  )}
                  <button className="w-10 h-10 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 transition-all">
                    {currentPage}
                  </button>
                  {currentPage < totalPages && (
                    <button onClick={() => handlePageChange(currentPage + 1)} className="w-10 h-10 rounded-xl text-xs font-black bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                      {currentPage + 1}
                    </button>
                  )}
                  {currentPage < totalPages - 1 && <span className="px-2 py-2 text-slate-300">...</span>}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Relatório de Estoque com Sócios"
        >
          <EstoqueComSociosTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default EstoquePage;
