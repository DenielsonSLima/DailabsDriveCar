
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormasPagamentoService } from './formas-pagamento.service';
import { IFormaPagamento } from './formas-pagamento.types';
import FormasPagamentoForm from './components/FormasPagamentoForm';
import FormasPagamentoList from './components/FormasPagamentoList';
import ConfirmModal from '../../../components/ConfirmModal';

const FormasPagamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<IFormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IFormaPagamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para modal de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await FormasPagamentoService.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const sub = FormasPagamentoService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Filtragem e Ordenação Alfabética (já vem do banco ordenado, mas garantimos no filtro)
  const filteredItems = useMemo(() => {
    return items
      .filter(i => i.nome.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [items, searchTerm]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: IFormaPagamento) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleClickDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await FormasPagamentoService.remove(deleteId);
      showToast('success', 'Forma de pagamento removida.');
      loadData(true);
      setDeleteId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: Partial<IFormaPagamento>) => {
    setIsSaving(true);
    try {
      await FormasPagamentoService.save(data);
      setIsFormOpen(false);
      showToast('success', data.id ? 'Atualizado com sucesso!' : 'Nova forma de pagamento criada!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative">
      {toast && (
        <div data-drivecar-ui className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-sm flex items-center space-x-3 animate-in slide-in-from-right duration-200 border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-rose-600'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Formas de Pagamento</h1>
          <p className="text-slate-500 mt-1">Configure PIX, Cartões, Boletos e lógicas financeiras.</p>
        </div>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold normal-case tracking-normal hover:bg-indigo-700 transition-all shadow-sm active:scale-100 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Forma
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
        <div className="mb-8 relative max-w-md">
           <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            placeholder="Pesquisar (Ex: PIX, Crédito)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium normal-case text-xs tracking-normal">Carregando configurações...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">Nenhuma forma de pagamento encontrada.</div>
        ) : (
          <FormasPagamentoList 
            items={filteredItems} 
            onEdit={handleEdit} 
            onDelete={handleClickDelete} 
          />
        )}
      </div>

      {isFormOpen && (
        <FormasPagamentoForm 
          initialData={editingItem}
          isSaving={isSaving}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Forma de Pagamento?"
        message={`Deseja excluir "${items.find(i => i.id === deleteId)?.nome}"? Transações antigas podem perder a referência.`}
        confirmText="Sim, Remover"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FormasPagamentoPage;
