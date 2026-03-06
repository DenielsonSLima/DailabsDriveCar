import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContasPagarService } from './contas-pagar.service';
import { FinanceiroService } from '../../financeiro.service';
import { ITituloPagar, PagarTab, IPagarFiltros } from './contas-pagar.types';
import PagarFilters from './components/PagarFilters';
import PagarList from './components/PagarList';
import PagarKpis from './components/PagarKpis';
import ModalBaixa from '../components/ModalBaixa';
import ModalDetalhesTitulo from './components/ModalDetalhesTitulo';
import ModalEditarTitulo from './components/ModalEditarTitulo';
import ConfirmModal from '../../../../components/ConfirmModal';

const ITEMS_PER_PAGE = 10;

const ContasPagarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PagarTab>('MES_ATUAL');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtros, setFiltros] = useState<IPagarFiltros>({
    busca: '',
    dataInicio: '',
    dataFim: '',
    categoriaId: '',
    status: ''
  });

  // Estados de Modais
  const [selectedTitulo, setSelectedTitulo] = useState<ITituloPagar | null>(null);
  const [viewingTitulo, setViewingTitulo] = useState<ITituloPagar | null>(null);
  const [editingTitulo, setEditingTitulo] = useState<ITituloPagar | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // TanStack Query: Dados principais
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contas-pagar', activeTab, filtros, currentPage],
    queryFn: () => ContasPagarService.getAll(activeTab, {
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
    staleTime: 1000 * 60 * 30, // 30 minutos
  });

  // Mutation: Exclusão
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ContasPagarService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      setDeleteId(null);
    }
  });

  // Realtime subscription
  useEffect(() => {
    const sub = ContasPagarService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
    });
    return () => { sub.unsubscribe(); };
  }, [queryClient]);

  // Reset pagination on filter/tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filtros]);

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

  const titulos = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = data?.totalPages || 1;

  const processedData = useMemo(() => {
    if (activeTab !== 'MES_ATUAL') return titulos;

    return titulos.reduce((acc: { [key: string]: ITituloPagar[] }, t) => {
      const key = t.status === 'PAGO' ? 'PAGO' : 'EM ABERTO';
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});
  }, [titulos, activeTab]);

  return (
    <div className="space-y-8 relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Contas a Pagar</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Agenda de compromissos financeiros e liquidação de pedidos</p>
        </div>


      </div>

      <PagarKpis titulos={titulos} />

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
        <button onClick={() => setActiveTab('MES_ATUAL')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MES_ATUAL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Mês Atual</button>
        <button onClick={() => setActiveTab('ATRASADOS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ATRASADOS' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Em Atraso</button>
        <button onClick={() => setActiveTab('FUTUROS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'FUTUROS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Futuros</button>
        <button onClick={() => setActiveTab('OUTROS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OUTROS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Outros Meses</button>
      </div>

      <PagarFilters filtros={filtros} onChange={setFiltros} categorias={categorias} />

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <PagarList
          items={processedData}
          loading={isLoading}
          isGrouped={activeTab === 'MES_ATUAL'}
          onPagar={setSelectedTitulo}
          onViewDetails={setViewingTitulo}
          onEdit={setEditingTitulo}
          onDelete={setDeleteId}
        />

        {/* Pagination Controls inside the card */}
        {!isLoading && totalPages > 1 && (
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
            queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
            queryClient.invalidateQueries({ queryKey: ['caixa-transacoes'] });
            queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
          }}
        />
      )}

      {viewingTitulo && (
        <ModalDetalhesTitulo
          titulo={viewingTitulo}
          onClose={() => setViewingTitulo(null)}
        />
      )}

      {editingTitulo && (
        <ModalEditarTitulo
          titulo={editingTitulo}
          onClose={() => setEditingTitulo(null)}
          onSuccess={() => { setEditingTitulo(null); queryClient.invalidateQueries({ queryKey: ['contas-pagar'] }); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Título?"
        message="Tem certeza que deseja remover esta conta? Caso ela seja vinculada a um pedido de compra, o rastreamento financeiro poderá ser perdido."
        confirmText="Sim, Excluir Registro"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ContasPagarPage;
