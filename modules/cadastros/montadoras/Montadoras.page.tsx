
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MontadorasService } from './montadoras.service';
import { IMontadora } from './montadoras.types';
import MontadoraCard from './components/MontadoraCard';
import FormMontadora from './components/FormMontadora';
import MontadorasKpis from './components/MontadorasKpis';
import ConfirmModal from '../../../components/ConfirmModal';

const MontadorasPage: React.FC = () => {
  const navigate = useNavigate();

  // Dados & Paginação
  const [montadoras, setMontadoras] = useState<IMontadora[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMontadora, setEditingMontadora] = useState<IMontadora | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para o Modal de Exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await MontadorasService.getPaginated({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm
      });
      setMontadoras(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.count);
    } catch (e) {
      console.error(e);
      showToast('error', 'Erro ao carregar dados');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Resetar página na busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingMontadora(null);
    setIsFormOpen(true);
  };

  const handleEdit = (montadora: IMontadora) => {
    setEditingMontadora(montadora);
    setIsFormOpen(true);
  };

  const handleClickDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await MontadorasService.remove(deleteId);
      showToast('success', 'Montadora excluída com sucesso!');
      loadData(true);
      setDeleteId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao excluir: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: Partial<IMontadora>) => {
    setIsSaving(true);
    try {
      await MontadorasService.save(data);
      setIsFormOpen(false);
      showToast('success', data.id ? 'Montadora atualizada!' : 'Nova montadora cadastrada!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      {toast && (
        <div className={`fixed top-6 right-6 z-[210] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-slate-900 text-white border-l-4 border-emerald-500' : 'bg-rose-600 text-white'
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
          <h1 className="text-3xl font-bold text-slate-900">Montadoras</h1>
          <p className="text-slate-500 mt-1">Gestão de fabricantes e marcas em tempo real.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nova Montadora
        </button>
      </div>

      <MontadorasKpis total={totalCount} />

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8 min-h-[500px]">
        <div className="mb-10 relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar montadora pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">Carregando catálogo...</p>
          </div>
        ) : montadoras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 text-slate-200">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">Nenhuma montadora encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {montadoras.map(m => (
              <MontadoraCard
                key={m.id}
                montadora={m}
                onEdit={handleEdit}
                onDelete={handleClickDelete}
              />
            ))}
          </div>
        )}

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages}</span>
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button className="w-10 h-10 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 transition-all">
                {currentPage}
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>

      {isFormOpen && (
        <FormMontadora
          initialData={editingMontadora}
          isSaving={isSaving}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Montadora?"
        message={`Deseja realmente remover a montadora "${montadoras.find(m => m.id === deleteId)?.nome}"? Modelos vinculados podem ser afetados.`}
        confirmText="Sim, Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MontadorasPage;
