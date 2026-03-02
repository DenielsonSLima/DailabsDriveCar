
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TiposVeiculosService } from './tipos-veiculos.service';
import { ITipoVeiculo } from './tipos-veiculos.types';
import ConfirmModal from '../../../components/ConfirmModal';

const TiposVeiculosPage: React.FC = () => {
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<ITipoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ITipoVeiculo | null>(null);
  const [nome, setNome] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para modal de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await TiposVeiculosService.getAll();
      setTipos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const sub = TiposVeiculosService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, []);

  const handleOpen = (item?: ITipoVeiculo) => {
    setEditing(item || null);
    setNome(item?.nome || '');
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsSaving(true);
    try {
      await TiposVeiculosService.save({
        id: editing?.id,
        nome: nome.trim()
      });
      setIsOpen(false);
      showToast('success', editing ? 'Categoria atualizada!' : 'Nova categoria cadastrada!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await TiposVeiculosService.remove(deleteId);
      showToast('success', 'Categoria removida com sucesso!');
      loadData(true);
      setDeleteId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao excluir: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[220] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-slate-900 text-white border-l-4 border-emerald-500' : 'bg-rose-600 text-white'
          }`}>
          <div className={toast.type === 'success' ? 'text-emerald-500' : 'text-white'}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tipos de Veículos</h1>
          <p className="text-slate-500 mt-1">Categorias: Sedan, Hatch, SUV, Pickup, etc.</p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
        >
          Novo Tipo
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Carregando categorias...</p>
          </div>
        ) : tipos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 text-slate-200">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Nenhuma categoria cadastrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tipos.map(t => (
              <div key={t.id} className="group relative bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-4 pr-16 w-full">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 font-black text-xs shrink-0">
                    {t.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-black text-slate-800 uppercase tracking-tighter truncate">{t.nome}</span>
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpen(t); }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClickDelete(t.id); }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                  {editing ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Defina o tipo veicular</p>
              </div>
              <button onClick={() => setIsOpen(false)} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome da Categoria</label>
                <input
                  autoFocus
                  value={nome}
                  onChange={e => setNome(e.target.value.toUpperCase())}
                  disabled={isSaving}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  placeholder="Ex: Sedan, SUV, Hatch..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  className="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50 min-w-[140px] flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    editing ? 'Atualizar' : 'Salvar Categoria'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Categoria?"
        message={`Deseja excluir "${tipos.find(t => t.id === deleteId)?.nome}"? Isso pode afetar filtros de modelos que utilizam esta classificação.`}
        confirmText="Sim, Remover"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TiposVeiculosPage;
