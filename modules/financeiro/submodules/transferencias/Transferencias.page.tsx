import React, { useState, useEffect, useMemo } from 'react';
import { TransferenciasService } from './transferencias.service';
import { ITransferencia, TransferenciaTab } from './transferencias.types';
import { ContasBancariasService } from '../../../ajustes/contas-bancarias/contas.service';
import { IContaBancaria } from '../../../ajustes/contas-bancarias/contas.types';
import TransferList from './components/TransferList';
import TransferForm from './components/TransferForm';
import TransferFilters from './components/TransferFilters';
import ConfirmModal from '../../../../components/ConfirmModal';

const TransferenciasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TransferenciaTab>('MES_ATUAL');
  const [transfers, setTransfers] = useState<ITransferencia[]>([]);
  const [contas, setContas] = useState<IContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<ITransferencia | null>(null);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [groupBy, setGroupBy] = useState<'nenhum' | 'mes' | 'conta'>('nenhum');

  // Estados para Exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
    ContasBancariasService.getAll().then(setContas);
    const sub = TransferenciasService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [activeTab]);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await TransferenciasService.getAll(activeTab);
      setTransfers(data);
    } finally {
      setLoading(false);
    }
  }

  // Lógica de Filtragem e Agrupamento Reativa
  const processedData = useMemo(() => {
    // 1. Filtragem
    const filtered = transfers.filter(t => {
      const matchSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.valor.toString().includes(searchTerm);
      
      const matchAccount = selectedAccountId 
        ? (t.conta_origem_id === selectedAccountId || t.conta_destino_id === selectedAccountId)
        : true;

      const matchDate = (dateStart ? t.data >= dateStart : true) && 
                        (dateEnd ? t.data <= dateEnd : true);

      return matchSearch && matchAccount && matchDate;
    });

    // 2. Agrupamento
    if (groupBy === 'nenhum') return filtered;

    return filtered.reduce((acc: any, t) => {
      let key = 'Diversos';
      if (groupBy === 'mes') {
        const d = new Date(t.data);
        key = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
      } else if (groupBy === 'conta') {
        key = t.conta_origem?.banco_nome || 'Conta Interna';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});
  }, [transfers, searchTerm, dateStart, dateEnd, selectedAccountId, groupBy]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (t: ITransferencia) => {
    setEditingTransfer(t);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await TransferenciasService.delete(deleteId);
      showToast('success', 'Transferência excluída e saldos revertidos!');
      setDeleteId(null);
      loadData(true);
    } catch (err: any) {
      showToast('error', "Erro ao excluir: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="dc-page space-y-6 relative">
      {toast && (
        <div data-drivecar-ui className={`fixed top-6 right-6 z-[200] px-4 py-4 rounded-xl shadow-sm flex items-center space-x-3 animate-in slide-in-from-right duration-200 border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <span className="font-semibold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="dc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="dc-page-title text-xl font-semibold text-slate-900 normal-case tracking-tight">Transferências entre Contas</h2>
          <p className="dc-page-subtitle text-slate-500 text-xs font-medium normal-case tracking-normal mt-1">Movimentação interna de liquidez</p>
        </div>
        
        <button 
          onClick={() => { setEditingTransfer(null); setIsFormOpen(true); }}
          className="dc-button px-4 py-4 bg-indigo-600 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-600 transition-all shadow-sm active:scale-100 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Transferência
        </button>
      </div>

      <div className="dc-tabs">
        <button onClick={() => { setActiveTab('MES_ATUAL'); setGroupBy('nenhum'); }} className={`dc-tab px-4 py-2.5 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all ${activeTab === 'MES_ATUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês Atual</button>
        <button onClick={() => setActiveTab('TODOS')} className={`dc-tab px-4 py-2.5 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all ${activeTab === 'TODOS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Todos os Meses</button>
      </div>

      <TransferFilters 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        dateStart={dateStart} setDateStart={setDateStart}
        dateEnd={dateEnd} setDateEnd={setDateEnd}
        selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
        groupBy={groupBy} setGroupBy={setGroupBy}
        contas={contas}
        showGrouping={activeTab === 'TODOS'}
      />

      <div className="dc-panel dc-panel-frame bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        <TransferList 
          transfers={processedData} 
          loading={loading} 
          isGrouped={groupBy !== 'nenhum'}
          onEdit={handleEdit} 
          onDelete={handleDeleteClick} 
        />
      </div>

      {isFormOpen && (
        <TransferForm 
          initialData={editingTransfer}
          onClose={() => { setIsFormOpen(false); setEditingTransfer(null); }} 
          onSuccess={() => { setIsFormOpen(false); setEditingTransfer(null); loadData(true); showToast('success', 'Transferência realizada!'); }}
        />
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Transferência?"
        message="Tem certeza que deseja apagar este registro? O valor será estornado para a conta de origem e retirado da conta de destino automaticamente."
        confirmText="Sim, Excluir e Reverter"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TransferenciasPage;