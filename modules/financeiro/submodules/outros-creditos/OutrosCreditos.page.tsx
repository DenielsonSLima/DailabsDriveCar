import React, { useState, useEffect, useMemo } from 'react';
import { OutrosCreditosService } from './outros-creditos.service';
import { ITituloCredito, CreditosTab, ICreditoFiltros, GroupByCredito } from './outros-creditos.types';
import CreditosFilters from './components/CreditosFilters';
import CreditosList from './components/CreditosList';
import CreditosKpis from './components/CreditosKpis';
import CreditoForm from './components/CreditoForm';
import ModalDetalhesCredito from './components/ModalDetalhesCredito';
import ConfirmModal from '../../../../components/ConfirmModal';

const OutrosCreditosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CreditosTab>('ABERTO');
  const [titulos, setTitulos] = useState<ITituloCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupByCredito>('conta');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 15;

  const [filtros, setFiltros] = useState<ICreditoFiltros>({
    busca: '',
    dataInicio: '',
    dataFim: ''
  });

  const [selectedTitulo, setSelectedTitulo] = useState<ITituloCredito | null>(null);
  const [editTitulo, setEditTitulo] = useState<ITituloCredito | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
    const sub = OutrosCreditosService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [activeTab, filtros, currentPage]);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const result = await OutrosCreditosService.getAll(activeTab, {
        ...filtros,
        page: currentPage,
        pageSize
      });
      setTitulos(result.data);
      setTotalItems(result.count);
    } finally {
      setLoading(false);
    }
  }

  const processedData = useMemo(() => {
    if (groupBy === 'nenhum') return titulos;

    return titulos.reduce((acc: any, t) => {
      let key = 'Diversos';
      if (groupBy === 'mes') {
        const d = new Date(t.data_vencimento);
        key = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
      } else if (groupBy === 'conta') {
        key = t.transacoes?.[0]?.conta_origem?.banco_nome || 'SEM CONTA DEFINIDA';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});
  }, [titulos, groupBy]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await OutrosCreditosService.delete(deleteId);
      setDeleteId(null);
      setToast({ type: 'success', message: 'Crédito removido com sucesso!' });
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
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Outros Créditos</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Aportes, rendimentos e entradas extraordinárias</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-8 py-4 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl active:scale-95 flex items-center shadow-teal-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Lançar Crédito
        </button>
      </div>

      <CreditosKpis titulos={titulos} />

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

      <CreditosFilters
        filtros={filtros}
        onChange={(f) => { setFiltros(f); setCurrentPage(0); }}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <CreditosList
          items={processedData}
          loading={loading}
          isGrouped={groupBy !== 'nenhum'}
          onReceber={(t) => setSelectedTitulo(t as any)}
          onEdit={(t) => { setEditTitulo(t); setIsFormOpen(true); }}
          onDelete={setDeleteId}
          pagination={{
            currentPage,
            pageSize,
            totalItems,
            onPageChange: setCurrentPage
          }}
        />
      </div>

      {selectedTitulo && (
        <ModalDetalhesCredito
          titulo={selectedTitulo as any}
          onClose={() => setSelectedTitulo(null)}
          onSuccess={() => { setSelectedTitulo(null); loadData(true); setToast({ type: 'success', message: 'Operação realizada com sucesso!' }); }}
        />
      )}

      {isFormOpen && (
        <CreditoForm
          editData={editTitulo || undefined}
          onClose={() => { setIsFormOpen(false); setEditTitulo(null); }}
          onSuccess={() => { setIsFormOpen(false); setEditTitulo(null); loadData(true); setToast({ type: 'success', message: editTitulo ? 'Crédito atualizado com sucesso!' : 'Crédito lançado com sucesso!' }); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Lançamento?"
        message="Deseja remover este registro de crédito? Se o valor já foi baixado, o saldo da conta bancária não será alterado automaticamente por aqui. O registro deixará de aparecer na lista."
        confirmText="Sim, Remover"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default OutrosCreditosPage;
