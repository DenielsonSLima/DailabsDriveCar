
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CorretoresService } from './corretores.service';
import { ICorretor } from './corretores.types';
import CorretorForm from './components/CorretorForm';
import CorretorList from './components/CorretorList';
import ConfirmModal from '../../../components/ConfirmModal';

const CorretoresPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ICorretor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICorretor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para notificações (Toast)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await CorretoresService.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Configuração do Realtime
    const sub = CorretoresService.subscribe((eventType) => {
      loadData(true);
      // Feedback visual discreto quando ocorre atualização externa
      if (eventType) {
        showToast('info', 'Lista de corretores atualizada em tempo real.');
      }
    });

    return () => { sub.unsubscribe(); };
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredItems = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(i =>
      i.nome.toLowerCase().includes(lowerSearch) ||
      i.sobrenome?.toLowerCase().includes(lowerSearch) ||
      i.cpf.includes(searchTerm)
    );
  }, [items, searchTerm]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: ICorretor) => {
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
      await CorretoresService.remove(deleteId);
      showToast('success', 'Corretor removido com sucesso.');
      // loadData é chamado pelo realtime, mas forçamos aqui para garantir UI imediata se offline
      setItems(prev => prev.filter(i => i.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao excluir.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: Partial<ICorretor>) => {
    setIsSaving(true);
    try {
      await CorretoresService.save(data);
      setIsFormOpen(false);
      showToast('success', data.id ? 'Cadastro atualizado!' : 'Novo corretor salvo!');
      // O realtime atualizará a lista, mas recarregamos para garantir consistência imediata
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' :
            toast.type === 'info' ? 'bg-indigo-600/95 text-white border-indigo-400/50' :
              'bg-rose-600 text-white border-rose-400/50'
          }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 text-white' :
              toast.type === 'info' ? 'bg-white text-indigo-600' :
                'bg-white text-rose-600'
            }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.type === 'success' ? "M5 13l4 4L19 7" : toast.type === 'info' ? "M13 10V3L4 14h7v7l9-11h-7z" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Corretores</h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-md animate-pulse">Realtime</span>
          </div>
          <p className="text-slate-500 mt-1">Gerencie a equipe comercial e parceiros de venda.</p>
        </div>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center active:scale-95">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Novo Corretor
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 min-h-[500px]">
        <div className="mb-8 relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, sobrenome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Carregando equipe...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">Nenhum corretor encontrado.</div>
        ) : (
          <CorretorList
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={handleClickDelete}
          />
        )}
      </div>

      {isFormOpen && (
        <CorretorForm
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
        title="Remover Corretor?"
        message={`Deseja realmente excluir "${items.find(i => i.id === deleteId)?.nome}"? O histórico de vendas pode ser impactado.`}
        confirmText="Sim, Remover"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CorretoresPage;
