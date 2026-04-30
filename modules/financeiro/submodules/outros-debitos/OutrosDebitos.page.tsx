import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OutrosDebitosService } from './outros-debitos.service';
import { ITituloDebito, DebitosTab, IDebitoFiltros, SortFieldDebito, SortOrder } from './outros-debitos.types';
import DebitosFilters from './components/DebitosFilters';
import DebitosList from './components/DebitosList';
import DebitosKpis from './components/DebitosKpis';
import DebitoForm from './components/DebitoForm';
import ModalDetalhesDebito from './components/ModalDetalhesDebito';
import ModalBaixa from '../components/ModalBaixa';
import ConfirmModal from '../../../../components/ConfirmModal';

const OutrosDebitosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DebitosTab>('ABERTO');
  const [titulos, setTitulos] = useState<ITituloDebito[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortFieldDebito>('alfabeto');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  const [filtros, setFiltros] = useState<IDebitoFiltros>({
    busca: '',
    dataInicio: '',
    dataFim: ''
  });

  const [selectedTitulo, setSelectedTitulo] = useState<ITituloDebito | null>(null);
  const [selectedBaixaTitulo, setSelectedBaixaTitulo] = useState<ITituloDebito | null>(null);
  const [editTitulo, setEditTitulo] = useState<ITituloDebito | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
    const sub = OutrosDebitosService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [activeTab, filtros, currentPage]);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [result, kpisResult] = await Promise.allSettled([
        OutrosDebitosService.getAll(activeTab, {
          ...filtros,
          page: currentPage,
          pageSize
        }),
        OutrosDebitosService.getKpis()
      ]);

      // Handle list result
      if (result.status === 'fulfilled') {
        setTitulos(result.value?.data || []);
        setTotalItems(result.value?.count || 0);
      } else {
        console.error('Erro ao carregar lista:', result.reason);
        setTitulos([]);
        setTotalItems(0);
      }

      // Handle KPIs result
      if (kpisResult.status === 'fulfilled') {
        setKpis(kpisResult.value);
      } else {
        console.error('Erro ao carregar KPIs:', kpisResult.reason);
        setKpis(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setTitulos([]);
      setTotalItems(0);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  }

  const processedData = useMemo(() => {
    if (!Array.isArray(titulos)) return [];

    return [...titulos].sort((a, b) => {
      if (!a || !b) return 0;
      let comparison = 0;
      if (sortBy === 'alfabeto') {
        comparison = (a.descricao || '').localeCompare(b.descricao || '');
      } else if (sortBy === 'data') {
        const dateA = a.data_vencimento ? new Date(a.data_vencimento).getTime() : 0;
        const dateB = b.data_vencimento ? new Date(b.data_vencimento).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'valor') {
        comparison = (a.valor_total || 0) - (b.valor_total || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [titulos, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await OutrosDebitosService.delete(deleteId);
      setDeleteId(null);
      setToast({ type: 'success', message: 'Débito removido com sucesso!' });
      
      // Invalida o dashboard do caixa para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
      
      loadData(true);
    } catch (e) {
      setToast({ type: 'error', message: 'Erro ao remover lançamento.' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 border backdrop-blur-md ${toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white'
          }`}>
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Outros Débitos</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Empréstimos, financiamentos e saídas extraordinárias</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl active:scale-95 flex items-center shadow-rose-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Lançar Débito
        </button>
      </div>

      <DebitosKpis kpis={kpis} loading={loading} />

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
        <button
          onClick={() => { setActiveTab('ABERTO'); setCurrentPage(0); }}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ABERTO' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Em Aberto
        </button>
        <button
          onClick={() => { setActiveTab('PAGO'); setCurrentPage(0); }}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PAGO' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Pagos
        </button>
        <button
          onClick={() => { setActiveTab('TODOS'); setCurrentPage(0); }}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TODOS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Todos
        </button>
      </div>

      <DebitosFilters
        filtros={filtros}
        onChange={(f) => { setFiltros(f); setCurrentPage(0); }}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <div className={`${viewMode === 'list' ? 'bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]' : ''}`}>
        <DebitosList
          items={processedData}
          loading={loading}
          viewMode={viewMode}
          onPagar={(t) => setSelectedTitulo(t as any)}
          onEdit={(t) => { setEditTitulo(t); setIsFormOpen(true); }}
          onDelete={setDeleteId}
          onBaixa={(t) => setSelectedBaixaTitulo(t)}
          pagination={{
            currentPage,
            pageSize,
            totalItems,
            onPageChange: setCurrentPage
          }}
        />
      </div>

      {selectedTitulo && (
        <ModalDetalhesDebito
          titulo={selectedTitulo as any}
          onClose={() => setSelectedTitulo(null)}
          onSuccess={() => { 
            setSelectedTitulo(null); 
            queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
            loadData(true); 
            setToast({ type: 'success', message: 'Operação realizada com sucesso!' }); 
          }}
        />
      )}

      {selectedBaixaTitulo && (
        <ModalBaixa
          titulo={selectedBaixaTitulo as any}
          onClose={() => setSelectedBaixaTitulo(null)}
          onSuccess={() => { 
            setSelectedBaixaTitulo(null); 
            queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
            loadData(true); 
            setToast({ type: 'success', message: 'Pagamento realizado com sucesso!' }); 
          }}
        />
      )}

      {isFormOpen && (
        <DebitoForm
          editData={editTitulo || undefined}
          onClose={() => { setIsFormOpen(false); setEditTitulo(null); }}
          onSuccess={() => { 
            setIsFormOpen(false); 
            setEditTitulo(null); 
            queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
            loadData(true); 
            setToast({ type: 'success', message: editTitulo ? 'Débito atualizado com sucesso!' : 'Débito lançado com sucesso!' }); 
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Lançamento?"
        message="Deseja remover este registro de débito? Se o valor já foi pago, o saldo da conta bancária não será alterado automaticamente por aqui. O registro deixará de aparecer na lista."
        confirmText="Sim, Remover"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default OutrosDebitosPage;
