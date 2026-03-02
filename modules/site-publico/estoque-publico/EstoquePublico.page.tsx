import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SitePublicoService } from '../site-publico.service';
import { IMontadoraPublic, IVeiculoPublic } from '../site-publico.types';
import { IEmpresa } from '../../ajustes/empresa/empresa.types';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import EstoquePublicoFilters from './components/EstoquePublicoFilters';
import EstoquePublicoList from './components/EstoquePublicoList';
import { setSEO, setDealerJsonLd, removeJsonLd } from '../utils/seo';

export type SortOption = 'created_desc' | 'preco_asc' | 'preco_desc';
export type GroupOption = 'none' | 'montadora' | 'tipo';

const EstoquePublicoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [empresa, setEmpresa] = useState<IEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [veiculos, setVeiculos] = useState<IVeiculoPublic[]>([]);
  const [montadoras, setMontadoras] = useState<IMontadoraPublic[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(12);
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const initialLoadDone = useRef(false);

  // Carrega apenas empresa e montadoras (sem buscar veículos da home desnecessariamente)
  useEffect(() => {
    async function loadInitial() {
      try {
        const [emp, monts] = await Promise.all([
          SitePublicoService.getEmpresa(),
          SitePublicoService.getMontadorasComEstoque()
        ]);
        setEmpresa(emp);
        setMontadoras(monts);

        // Se houver marca na URL, seleciona ela
        if (!initialLoadDone.current) {
          const marcaId = searchParams.get('marca');
          if (marcaId) setSelectedBrand(marcaId);
          initialLoadDone.current = true;
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();

    // SEO: Define título e meta tags da página
    setSEO({
      title: 'Estoque | Hidrocar Veículos - Veículos em Aracaju/SE',
      description: 'Confira nosso estoque de veículos selecionados. Filtre por marca, preço e encontre o veículo ideal na Hidrocar Veículos.',
      url: `${window.location.origin}/estoque-publico`
    });

    // JSON-LD: Dados estruturados da loja
    setDealerJsonLd({
      name: 'Hidrocar Veículos - Estoque',
      description: 'Estoque de veículos selecionados com procedência comprovada.',
      url: `${window.location.origin}/estoque-publico`,
      image: `${window.location.origin}/logos/logohidrocarsimbolo.png`,
    });

    const subscription = SitePublicoService.subscribe(() => {
      loadInitial();
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      subscription.unsubscribe();
      removeJsonLd();
    };
  }, []);

  // Monitora mudanças nos filtros e paginação para buscar veículos
  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);
      try {
        // Só busca montadoras junto com veículos se ainda não tiver nenhuma
        const res = await SitePublicoService.getStockData({
          page,
          pageSize,
          brand: selectedBrand || undefined,
          minPrice: minPrice === '' ? undefined : minPrice,
          maxPrice: maxPrice === '' ? undefined : maxPrice,
          search: searchTerm || undefined,
          sort: sortBy,
          includeMontadoras: montadoras.length === 0
        });

        setVeiculos(res.veiculos);
        setTotalItems(res.total);
        if (res.montadoras) setMontadoras(res.montadoras); // Atualiza contadores apenas se solicitado e retornado
      } catch (error) {
        console.error("Erro ao buscar estoque:", error);
      } finally {
        setLoading(false);
      }
    }

    // Debounce na busca textual para não chamar toda hora
    const timeoutId = setTimeout(() => {
      fetchVehicles();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [page, pageSize, selectedBrand, minPrice, maxPrice, searchTerm, sortBy, refreshTrigger]);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [selectedBrand, minPrice, maxPrice, searchTerm, sortBy]);

  // Processamento para agrupamento (feito no cliente apenas com os dados da página atual)
  const processedData = useMemo(() => {
    if (groupBy === 'none') return veiculos;

    return veiculos.reduce((acc: { [key: string]: any[] }, v) => {
      let key = 'Outros';
      if (groupBy === 'montadora') key = v.montadora?.nome || 'Sem Marca';
      if (groupBy === 'tipo') key = v.tipo_veiculo?.nome || 'Sem Categoria';

      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    }, {});
  }, [veiculos, groupBy]);

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] antialiased">
      <PublicNavbar empresa={empresa || {} as IEmpresa} />

      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* SIDEBAR - FILTROS E CONTROLES DE VISÃO */}
            <aside className="w-full lg:w-80 shrink-0 space-y-10">
              <EstoquePublicoFilters
                montadoras={montadoras}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                sortBy={sortBy}
                setSortBy={setSortBy}
                groupBy={groupBy}
                setGroupBy={setGroupBy}
                whatsappPhone={empresa?.telefone}
              />
            </aside>

            {/* CONTEÚDO PRINCIPAL - BUSCA E LISTAGEM */}
            <div className="flex-1 space-y-8">
              {/* Barra de Busca Refinada */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex-1 relative min-w-0">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-6 text-[#004691]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Pesquisar por modelo ou placa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:ring-4 focus:ring-[#004691]/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="shrink-0 flex flex-col items-end px-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Encontrados</p>
                  <p className="text-sm font-black text-[#004691] uppercase tracking-tighter">
                    {totalItems} Veículos
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-40 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-[#004691] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando estoque...</p>
                </div>
              ) : (
                <>
                  <EstoquePublicoList
                    veiculos={processedData}
                    isGrouped={groupBy !== 'none'}
                  />

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-8">
                      <button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-[#004691] transition-all"
                      >
                        Anterior
                      </button>
                      <span className="text-xs font-bold text-slate-400">
                        Página {page} de {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={page === totalPages}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-[#004691] transition-all"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter empresa={empresa || {} as IEmpresa} />
    </div>
  );
};

export default EstoquePublicoPage;