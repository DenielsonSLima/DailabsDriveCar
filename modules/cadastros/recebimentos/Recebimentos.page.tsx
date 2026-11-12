
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecebimentosService } from './recebimentos.service';
import { ITipoRecebimento } from './recebimentos.types';
import RecebimentoForm from './components/RecebimentoForm';
import RecebimentoList from './components/RecebimentoList';
import ConfirmModal from '../../../components/ConfirmModal';

const RecebimentosPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ITipoRecebimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ITipoRecebimento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para modal de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await RecebimentosService.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const sub = RecebimentosService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => i.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: ITipoRecebimento) => {
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
      await RecebimentosService.remove(deleteId);
      showToast('success', 'Tipo removido com sucesso.');
      loadData(true);
      setDeleteId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: Partial<ITipoRecebimento>) => {
    setIsSaving(true);
    try {
      await RecebimentosService.save(data);
      setIsFormOpen(false);
      showToast('success', data.id ? 'Item atualizado!' : 'Novo tipo cadastrado!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dc-page animate-in fade-in duration-200 relative">
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
        <div className="flex items-start space-x-4">
          <button onClick={() => navigate('/cadastros')} className="mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="dc-page-title">Tipos de Recebimentos</h1>
            <p className="dc-page-subtitle">Gerencie as formas de entrada de valores (Ex: PIX, Cartão).</p>
          </div>
        </div>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold normal-case tracking-normal hover:bg-emerald-700 transition-all shadow-sm shadow-none active:scale-100 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Novo Tipo
        </button>
      </div>

      <div className="dc-panel min-h-[500px]">
        <div className="mb-8 relative max-w-md">
           <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            placeholder="Pesquisar (ex: PIX, Crédito)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium normal-case text-xs tracking-normal">Sincronizando opções...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">Nenhum tipo cadastrado.</div>
        ) : (
          <RecebimentoList 
            items={filteredItems} 
            onEdit={handleEdit} 
            onDelete={handleClickDelete} 
          />
        )}
      </div>

      {isFormOpen && (
        <RecebimentoForm 
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
        title="Excluir Tipo?"
        message={`Deseja excluir "${items.find(i => i.id === deleteId)?.nome}"?`}
        confirmText="Sim, Remover"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RecebimentosPage;
