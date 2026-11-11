
import React, { useState, useEffect } from 'react';
import { TiposDespesasService } from '../tipos-despesas.service';
import { IGrupoDespesa, ICategoriaDespesa, TipoMacroDespesa } from '../tipos-despesas.types';
import GroupForm from './GroupForm';
import CategoryForm from './CategoryForm';
import ConfirmModal from '../../../../components/ConfirmModal';

const ExpenseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TipoMacroDespesa>('FIXA');
  const [grupos, setGrupos] = useState<IGrupoDespesa[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de Accordion (ID do grupo expandido)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Modais de Edição
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IGrupoDespesa | null>(null);
  
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [selectedGroupForCategory, setSelectedGroupForCategory] = useState<IGrupoDespesa | null>(null);
  const [editingCategory, setEditingCategory] = useState<ICategoriaDespesa | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Estados para Exclusão e Feedback (Padronização)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'GROUP' | 'CATEGORY', name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
    const sub = TiposDespesasService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [activeTab]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await TiposDespesasService.getByTipo(activeTab);
    setGrupos(data);
    setLoading(false);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Handlers de Grupo ---
  const handleOpenGroupForm = (grupo?: IGrupoDespesa) => {
    setEditingGroup(grupo || null);
    setIsGroupFormOpen(true);
  };

  const handleSaveGroup = async (data: Partial<IGrupoDespesa>) => {
    setIsSaving(true);
    try {
      await TiposDespesasService.saveGrupo(data);
      setIsGroupFormOpen(false);
      showToast('success', data.id ? 'Grupo atualizado!' : 'Grupo criado com sucesso!');
      loadData(true);
    } catch (e) {
      showToast('error', 'Erro ao salvar grupo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickDeleteGroup = (grupo: IGrupoDespesa) => {
    const qtdCategorias = grupo.categorias?.length || 0;
    
    if (qtdCategorias > 0) {
      showToast('error', `O grupo possui ${qtdCategorias} categorias. Remova-as antes de excluir o grupo.`);
      return;
    }
    
    setDeleteTarget({ id: grupo.id, type: 'GROUP', name: grupo.nome });
  };

  // --- Handlers de Categoria ---
  const handleOpenCategoryForm = (grupo: IGrupoDespesa, categoria?: ICategoriaDespesa) => {
    setSelectedGroupForCategory(grupo);
    setEditingCategory(categoria || null);
    setIsCategoryFormOpen(true);
  };

  const handleSaveCategory = async (data: Partial<ICategoriaDespesa>) => {
    setIsSaving(true);
    try {
      await TiposDespesasService.saveCategoria(data);
      setIsCategoryFormOpen(false);
      showToast('success', data.id ? 'Categoria atualizada!' : 'Categoria criada com sucesso!');
      loadData(true);
    } catch (e) {
      showToast('error', 'Erro ao salvar categoria.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickDeleteCategory = (categoria: ICategoriaDespesa) => {
    setDeleteTarget({ id: categoria.id, type: 'CATEGORY', name: categoria.nome });
  };

  // --- Confirmação de Exclusão Unificada ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'GROUP') {
        await TiposDespesasService.deleteGrupo(deleteTarget.id);
        showToast('success', 'Grupo removido com sucesso.');
      } else {
        await TiposDespesasService.deleteCategoria(deleteTarget.id);
        showToast('success', 'Categoria removida com sucesso.');
      }
      loadData(true);
      setDeleteTarget(null);
    } catch (e) {
      showToast('error', 'Erro ao excluir o registro.');
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs: { id: TipoMacroDespesa; label: string; color: string }[] = [
    { id: 'FIXA', label: 'Despesas Fixas', color: 'indigo' },
    { id: 'VARIAVEL', label: 'Despesas Variáveis', color: 'emerald' }
  ];

  const currentTabColor = tabs.find(t => t.id === activeTab)?.color || 'indigo';

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative">
      
      {/* Toast Notification */}
      {toast && (
        <div data-drivecar-ui className={`fixed top-6 right-6 z-[250] px-6 py-4 rounded-2xl shadow-sm flex items-center space-x-3 animate-in slide-in-from-right duration-200 border backdrop-blur-md ${
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

      {/* Abas de Navegação */}
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setExpandedGroup(null); }}
            className={`px-6 py-4 rounded-2xl text-sm font-semibold normal-case tracking-normal transition-all shadow-sm flex items-center space-x-2 ${
              activeTab === tab.id 
                ? `bg-${tab.color}-600 text-white shadow-${tab.color}-200 shadow-sm scale-100`
                : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="w-2 h-2 bg-white rounded-full ml-2 animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Área de Conteúdo */}
      <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[500px] relative overflow-hidden ring-4 ring-${currentTabColor}-50/50 transition-all`}>
        
        {/* Header da Lista */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className={`text-2xl font-semibold text-slate-900 normal-case tracking-tight`}>
              Grupos de <span className={`text-${currentTabColor}-600`}>{tabs.find(t => t.id === activeTab)?.label}</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1">Organize suas contas e centros de custo.</p>
          </div>
          <button 
            onClick={() => handleOpenGroupForm()}
            className={`px-6 py-3 rounded-2xl text-xs font-semibold normal-case tracking-normal text-white shadow-sm transition-all active:scale-100 flex items-center bg-${currentTabColor}-600 hover:bg-${currentTabColor}-700 shadow-${currentTabColor}-200`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Novo Grupo
          </button>
        </div>

        {/* Lista de Grupos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className={`w-12 h-12 border-4 border-${currentTabColor}-600 border-t-transparent rounded-full animate-spin`}></div>
            <p className="text-slate-500 font-medium normal-case text-xs tracking-normal">Carregando plano de contas...</p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </div>
            <p className="text-slate-500 font-medium text-sm">Nenhum grupo cadastrado nesta categoria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map(grupo => {
              const isExpanded = expandedGroup === grupo.id;
              
              return (
                <div key={grupo.id} className={`border rounded-2xl transition-all duration-200 ${isExpanded ? `border-${currentTabColor}-200 bg-${currentTabColor}-50/30 shadow-sm` : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}`}>
                  
                  {/* Cabeçalho do Grupo */}
                  <div 
                    onClick={() => setExpandedGroup(isExpanded ? null : grupo.id)}
                    className="p-5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? `bg-${currentTabColor}-600 text-white` : 'bg-white text-slate-400 shadow-sm'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold normal-case tracking-tight ${isExpanded ? `text-${currentTabColor}-900` : 'text-slate-700'}`}>{grupo.nome}</h4>
                        <p className="text-xs text-slate-500 font-medium normal-case tracking-normal mt-0.5">
                          {grupo.categorias?.length || 0} {grupo.categorias?.length === 1 ? 'Categoria' : 'Categorias'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Ações do Grupo */}
                      <div className="flex space-x-1 mr-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenGroupForm(grupo); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Editar Grupo"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleClickDeleteGroup(grupo); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Excluir Grupo"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      
                      {/* Seta Accordion */}
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-slate-400`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Corpo do Grupo (Lista de Categorias) */}
                  {isExpanded && (
                    <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-xs text-slate-500 font-medium normal-case tracking-normal ml-1">Itens do Grupo</p>
                          <button 
                            onClick={() => handleOpenCategoryForm(grupo)}
                            className={`text-xs font-semibold normal-case tracking-normal text-${currentTabColor}-600 hover:bg-${currentTabColor}-50 px-3 py-1.5 rounded-lg transition-colors flex items-center`}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Adicionar Item
                          </button>
                        </div>

                        {(!grupo.categorias || grupo.categorias.length === 0) ? (
                          <div className="text-center py-6 text-slate-300 italic text-xs">Nenhuma categoria cadastrada neste grupo.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {grupo.categorias.map(cat => (
                              <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors group/cat">
                                <div className="flex items-center space-x-2 overflow-hidden">
                                  <div className={`w-1.5 h-1.5 rounded-full bg-${currentTabColor}-400 shrink-0`}></div>
                                  <span className="text-xs font-medium text-slate-700 truncate">{cat.nome}</span>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                  <button onClick={() => handleOpenCategoryForm(grupo, cat)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => handleClickDeleteCategory(cat)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modais de Edição */}
      {isGroupFormOpen && (
        <GroupForm 
          tipoAtual={activeTab} 
          initialData={editingGroup} 
          onClose={() => setIsGroupFormOpen(false)} 
          onSubmit={handleSaveGroup}
          isSaving={isSaving}
        />
      )}

      {isCategoryFormOpen && selectedGroupForCategory && (
        <CategoryForm 
          grupo={selectedGroupForCategory} 
          initialData={editingCategory} 
          onClose={() => setIsCategoryFormOpen(false)} 
          onSubmit={handleSaveCategory}
          isSaving={isSaving}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === 'GROUP' ? "Excluir Grupo?" : "Excluir Categoria?"}
        message={deleteTarget?.type === 'GROUP' 
          ? `Deseja realmente excluir o grupo "${deleteTarget.name}"?`
          : `Deseja realmente excluir a categoria "${deleteTarget?.name}"?`
        }
        confirmText="Sim, Excluir"
        variant="danger"
        isLoading={isDeleting}
      />

    </div>
  );
};

export default ExpenseManager;
