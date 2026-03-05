import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContasReceberService } from './contas-receber.service';
import { FinanceiroService } from '../../financeiro.service';
import { ITituloReceber, ReceberTab, IReceberFiltros } from './contas-receber.types';
import ReceberFilters from './components/ReceberFilters';
import ReceberList from './components/ReceberList';
import ReceberKpis from './components/ReceberKpis';
import ModalBaixa from '../components/ModalBaixa';
import ConfirmModal from '../../../../components/ConfirmModal';
import ReceberQuickView from './components/ReceberQuickView';

const ITEMS_PER_PAGE = 10;

const ContasReceberPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReceberTab>('MES_ATUAL');
  const [currentPage, setCurrentPage] = useState(1);
  const [groupBy, setGroupBy] = useState<'nenhum' | 'mes' | 'parceiro'>('nenhum');

  const [filtros, setFiltros] = useState<IReceberFiltros>({
    busca: '',
    dataInicio: '',
    dataFim: '',
    categoriaId: '',
    status: ''
  });

  const [selectedTitulo, setSelectedTitulo] = useState<ITituloReceber | null>(null);
  const [selectedQuickView, setSelectedQuickView] = useState<ITituloReceber | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // TanStack Query: Dados principais
  const { data, isLoading } = useQuery({
    queryKey: ['contas-receber', activeTab, filtros, currentPage],
    queryFn: () => ContasReceberService.getAll(activeTab, {
      ...filtros,
      page: currentPage,
      limit: ITEMS_PER_PAGE
    }),
    staleTime: 1000 * 60 * 5, // 5 minutos (Surgical Realtime handle invalidation)
  });

  // Query: Categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ['financeiro-categorias'],
    queryFn: () => FinanceiroService.getCategorias(),
    staleTime: 1000 * 60 * 30,
  });

  // Mutation: Exclusão
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ContasReceberService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      setDeleteId(null);
    }
  });

  // Realtime subscription
  useEffect(() => {
    const sub = ContasReceberService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
    });
    return () => { sub.unsubscribe(); };
  }, [queryClient]);

  // Reset pagination on filter/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filtros]);

  const titulos = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = data?.totalPages || 1;

  const processedData = useMemo(() => {
    if (groupBy === 'nenhum') return titulos;

    return titulos.reduce((acc: any, t) => {
      let key = 'DIVERSOS';
      if (groupBy === 'mes') {
        const d = new Date(t.data_vencimento);
        key = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
      } else if (groupBy === 'parceiro') {
        key = t.parceiro?.nome || 'CLIENTE NÃO IDENTIFICADO';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});
  }, [titulos, groupBy]);

  const handleDelete = async () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && (data ? page <= data.totalPages : true)) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Contas a Receber</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Gestão de fluxo de caixa e entradas de faturamento</p>
        </div>


      </div>

      <ReceberKpis titulos={titulos} />

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
        <button onClick={() => { setActiveTab('MES_ATUAL'); setGroupBy('nenhum'); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MES_ATUAL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Mês Atual</button>
        <button onClick={() => setActiveTab('ATRASADOS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ATRASADOS' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Vencidos</button>
        <button onClick={() => setActiveTab('OUTROS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OUTROS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Todos os Meses</button>
      </div>

      <ReceberFilters
        filtros={filtros}
        onChange={setFiltros}
        categorias={categorias}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        showGrouping={activeTab === 'OUTROS'}
      />

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <ReceberList
          items={processedData}
          loading={isLoading}
          isGrouped={groupBy !== 'nenhum'}
          onBaixa={(t) => setSelectedTitulo(t as any)}
          onDelete={setDeleteId}
          onRowClick={(t) => setSelectedQuickView(t as any)}
        />

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && groupBy === 'nenhum' && (
          <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages}</span>
              <span className="ml-2 opacity-50">({totalCount} registros)</span>
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button className="w-8 h-8 rounded-lg text-[10px] font-black bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center">
                {currentPage}
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTitulo && (
        <ModalBaixa
          titulo={selectedTitulo as any}
          onClose={() => setSelectedTitulo(null)}
          onSuccess={() => {
            setSelectedTitulo(null);
            queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
            queryClient.invalidateQueries({ queryKey: ['caixa-transacoes'] });
            queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
          }}
        />
      )}

      {selectedQuickView && (
        <ReceberQuickView
          titulo={selectedQuickView as any}
          isOpen={!!selectedQuickView}
          onClose={() => setSelectedQuickView(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Estornar Título?"
        message="Deseja remover este registro de recebimento? Se ele for fruto de uma venda, o saldo a receber do pedido será reaberto."
        confirmText="Sim, Estornar"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ContasReceberPage;
