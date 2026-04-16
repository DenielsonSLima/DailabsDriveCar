
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoresService } from './cores.service';
import { ICor } from './cores.types';
import CoresForm from './components/CoresForm';
import CoresList from './components/CoresList';
import ConfirmModal from '../../../components/ConfirmModal';

const CoresPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ICor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [displayStatus, setDisplayStatus] = useState<'active' | 'inactive'>('active');

  // Inativação
  const [inactivateId, setInactivateId] = useState<string | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await CoresService.getAll(displayStatus === 'active');
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const sub = CoresService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [displayStatus]);

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

  const handleEdit = (item: ICor) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleClickInactivate = (id: string) => {
    setInactivateId(id);
  };

  const handleConfirmInactivate = async () => {
    if (!inactivateId) return;
    setIsInactivating(true);
    try {
      await CoresService.remove(inactivateId);
      showToast('success', 'Cor inativada com sucesso.');
      loadData(true);
      setInactivateId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao inativar.');
    } finally {
      setIsInactivating(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await CoresService.reactivate(id);
      showToast('success', 'Cor reativada com sucesso!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao reativar.');
    }
  };

  const handleSubmit = async (data: Partial<ICor>) => {
    setIsSaving(true);
    try {
      await CoresService.save(data);
      setIsFormOpen(false);
      showToast('success', data.id ? 'Cor atualizada!' : 'Nova cor salva!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-rose-600'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Cores e Pintura</h1>
          <p className="text-slate-500 mt-1">Gerencie a paleta de cores para os veículos.</p>
        </div>
        <button onClick={handleOpenAdd} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Cor
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 min-h-[500px]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Pesquisar (ex: Branco, Prata)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-bold"
            />
          </div>

          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setDisplayStatus('active')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${displayStatus === 'active'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setDisplayStatus('inactive')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${displayStatus === 'inactive'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Inativos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando paleta...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">Nenhuma cor cadastrada.</div>
        ) : (
          <CoresList 
            items={filteredItems} 
            onEdit={handleEdit} 
            onDelete={handleClickInactivate} 
            onReactivate={handleReactivate}
          />
        )}
      </div>

      {isFormOpen && (
        <CoresForm 
          initialData={editingItem}
          isSaving={isSaving}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal 
        isOpen={!!inactivateId}
        onClose={() => setInactivateId(null)}
        onConfirm={handleConfirmInactivate}
        title="Inativar Cor?"
        message={`Deseja inativar a cor "${items.find(i => i.id === inactivateId)?.nome}"? Ela não aparecerá mais para novos cadastros de estoque.`}
        confirmText="Sim, Inativar"
        variant="warning"
        isLoading={isInactivating}
      />
    </div>
  );
};

export default CoresPage;
