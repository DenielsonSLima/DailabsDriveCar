
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SociosService } from './socios.service';
import { ISocio } from './socios.types';
import ListSocios from './components/ListSocios';
import FormSocio from './components/FormSocio';

const SociosPage: React.FC = () => {
  const navigate = useNavigate();
  const [socios, setSocios] = useState<ISocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<ISocio | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Carregamento inicial e Subscrição Realtime
  useEffect(() => {
    loadSocios();
    
    const subscription = SociosService.subscribe(() => {
      loadSocios(true); // Recarrega silenciosamente quando houver mudanças no banco
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const loadSocios = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await SociosService.getAll();
      setSocios(data);
    } catch (error) {
      console.error(error);
      showToast('error', 'Erro ao carregar sócios.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSocio(null);
    setIsFormOpen(true);
  };

  const handleEdit = (socio: ISocio) => {
    setEditingSocio(socio);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: Partial<ISocio>) => {
    try {
      await SociosService.save(data);
      showToast('success', data.id ? 'Sócio atualizado com sucesso!' : 'Sócio cadastrado com sucesso!');
      setIsFormOpen(false);
      setEditingSocio(null);
      // O realtime atualizará a lista, mas podemos forçar um reload para garantir a UI imediata
      if (!data.id) loadSocios(true); 
    } catch (error: any) {
      showToast('error', 'Erro ao salvar: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este sócio? Esta ação não pode ser desfeita.')) {
      try {
        await SociosService.delete(id);
        showToast('success', 'Sócio removido.');
        // Realtime atualizará a lista
      } catch (error: any) {
        showToast('error', 'Erro ao excluir: ' + error.message);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const socio = socios.find(s => s.id === id);
    if (socio) {
      try {
        await SociosService.toggleStatus(id, socio.ativo);
        // Realtime atualizará a UI
      } catch (error: any) {
        showToast('error', 'Erro ao alterar status.');
      }
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium normal-case text-xs tracking-normal">Carregando quadro societário...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative">
      {/* Toast Notification */}
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
          <button 
            onClick={() => navigate('/ajustes')}
            className="mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Quadro de Sócios</h1>
            <p className="text-slate-500 mt-1">Gerencie os administradores e proprietários do sistema.</p>
          </div>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenAdd}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold normal-case tracking-normal hover:bg-indigo-700 transition-all shadow-sm shadow-none flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Sócio
          </button>
        )}
      </div>

      <div className="max-w-6xl">
        {isFormOpen && (
          <FormSocio 
            initialData={editingSocio} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsFormOpen(false)} 
          />
        )}

        <ListSocios 
          socios={socios} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onToggleStatus={handleToggleStatus} 
        />
      </div>
    </div>
  );
};

export default SociosPage;
