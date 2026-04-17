
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModelosService } from './modelos.service';
import { IModelo, IModelosAgrupados } from './modelos.types';
import { IMontadora } from '../montadoras/montadoras.types';
import { MontadorasService } from '../montadoras/montadoras.service';
import { ITipoVeiculo } from '../tipos-veiculos/tipos-veiculos.types';
import { TiposVeiculosService } from '../tipos-veiculos/tipos-veiculos.service';
import ModelosList from './components/ModelosList';
import ModeloForm from './components/ModeloForm';
import ConfirmModal from '../../../components/ConfirmModal';

const ModelosPage: React.FC = () => {
  const navigate = useNavigate();
  const [agrupados, setAgrupados] = useState<IModelosAgrupados>({});
  const [montadoras, setMontadoras] = useState<IMontadora[]>([]);
  const [tipos, setTipos] = useState<ITipoVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<IModelo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMontadora, setSelectedMontadora] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [displayStatus, setDisplayStatus] = useState<'active' | 'inactive'>('active');

  // Inativação
  const [inactivateId, setInactivateId] = useState<string | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [montadorasData, tiposData] = await Promise.all([
        MontadorasService.getAll(true),
        TiposVeiculosService.getAll(true)
      ]);
      setMontadoras(montadorasData);
      setTipos(tiposData);

      // Se já tiver uma montadora selecionada, recarrega os modelos dela
      if (selectedMontadora) {
        const montadora = montadorasData.find(m => m.nome === selectedMontadora);
        if (montadora) {
          await loadModelos(montadora);
        }
      }
    } finally {
      if (!selectedMontadora) setLoading(false);
    }
  };

  const loadModelos = async (montadora: IMontadora) => {
    setLoading(true);
    try {
      // Usamos a aba atual para decidir se queremos ativos ou inativos
      const modelos = await ModelosService.getByMontadora(montadora.id, displayStatus === 'active');

      // Reconstrói o objeto agrupado apenas para a montadora selecionada
      const novoAgrupado: IModelosAgrupados = {
        [montadora.nome]: {
          montadora,
          modelos
        }
      };
      setAgrupados(novoAgrupado);
    } catch (error) {
      showToast('error', 'Erro ao carregar modelos da montadora.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMontadora) {
      const montadora = montadoras.find(m => m.nome === selectedMontadora);
      if (montadora) {
        loadModelos(montadora);
      }
    }
  }, [displayStatus]);

  const handleSelectMontadora = async (nome: string) => {
    if (selectedMontadora === nome) {
      // Se clicar na mesma, talvez limpar a seleção? Ou não fazer nada?
      // O usuário pediu "abre somente os modelos daquela montadora".
      // Vamos manter a seleção.
      return;
    }

    setSelectedMontadora(nome);
    const montadora = montadoras.find(m => m.nome === nome);
    if (montadora) {
      await loadModelos(montadora);
    }
  };

  useEffect(() => {
    loadData();
    const subscription = ModelosService.subscribe(() => {
      loadData(true);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const montadorasDisponiveis = useMemo(() => {
    return montadoras.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [montadoras]);

  const filteredAgrupados = useMemo(() => {
    const filtered: IModelosAgrupados = {};
    const search = searchTerm.toLowerCase();


    // Filtra sobre o agrupados atual (que só tem a montadora selecionada)
    Object.keys(agrupados).forEach(nome => {
      if (selectedMontadora && nome !== selectedMontadora) return;

      const montadoraGroup = agrupados[nome];

      const matchingModelos = montadoraGroup.modelos
        .filter(m => {
          const matchSearch = m.nome.toLowerCase().includes(search);
          const matchTipo = selectedTipo ? m.tipo_veiculo_id === selectedTipo : true;
          return matchSearch && matchTipo;
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));

      if (matchingModelos.length > 0) {
        filtered[nome] = {
          ...montadoraGroup,
          modelos: matchingModelos
        };
      }
    });

    return filtered;
  }, [agrupados, searchTerm, selectedMontadora, selectedTipo, montadorasDisponiveis]);

  const handleOpenAdd = () => {
    let initialMontadoraId = '';
    if (selectedMontadora) {
      const montadora = montadoras.find(m => m.nome === selectedMontadora);
      if (montadora) {
        initialMontadoraId = montadora.id;
      }
    }

    // We pass it as partial IModelo but without an id, so it represents a "New Model" with pre-filled fields
    setEditingModelo(initialMontadoraId ? { montadora_id: initialMontadoraId } as IModelo : null);
    setIsFormOpen(true);
  };

  const handleEdit = (modelo: IModelo) => {
    setEditingModelo(modelo);
    setIsFormOpen(true);
  };

  const handleClickInactivate = (id: string) => {
    setInactivateId(id);
  };

  const handleConfirmInactivate = async () => {
    if (!inactivateId) return;
    setIsInactivating(true);
    try {
      await ModelosService.remove(inactivateId);
      showToast('success', 'Modelo inativado com sucesso!');
      loadData(true);
      setInactivateId(null);
    } catch (err: any) {
      showToast('error', 'Erro ao inativar: ' + err.message);
    } finally {
      setIsInactivating(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await ModelosService.reactivate(id);
      showToast('success', 'Modelo reativado com sucesso!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao reativar: ' + err.message);
    }
  };

  const handleSubmit = async (data: Partial<IModelo>) => {
    setIsSaving(true);
    try {
      await ModelosService.save(data);
      setIsFormOpen(false);
      showToast('success', data.id ? 'Modelo atualizado!' : 'Novo modelo cadastrado!');
      loadData(true);
    } catch (err: any) {
      showToast('error', 'Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getModeloNameById = (id: string | null) => {
    if (!id) return '';
    for (const group of Object.values(agrupados)) {
      const modelo = group.modelos.find(m => m.id === id);
      if (modelo) return modelo.nome;
    }
    return '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[110] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-slate-900 text-white border-l-4 border-emerald-500' : 'bg-rose-600 text-white'
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
          <h1 className="text-3xl font-bold text-slate-900">Catálogo de Modelos</h1>
          <p className="text-slate-500 mt-1">Gerenciamento técnico de modelos vinculado às montadoras.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center active:scale-95"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Novo Modelo
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8 min-h-[600px]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar por modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm font-bold"
              />
            </div>

            <div className="w-full md:w-56">
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm font-bold cursor-pointer"
              >
                <option value="">Todos os Tipos</option>
                {tipos.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Selector */}
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

        {/* Grid de Montadoras */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 mb-4 px-1">Selecione uma Montadora</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {montadoras.map(m => (
              <button
                key={m.id}
                onClick={() => handleSelectMontadora(m.nome)}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left ${selectedMontadora === m.nome
                  ? 'bg-indigo-50 border border-indigo-500 shadow-sm ring-1 ring-indigo-200'
                  : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
                  }`}
              >
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
                  {m.logo_url ? (
                    <img
                      src={m.logo_url}
                      alt={m.nome}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">{m.nome.substring(0, 2)}</span>
                  )}
                </div>
                <span className={`text-xs font-bold uppercase tracking-tight truncate ${selectedMontadora === m.nome ? 'text-indigo-700' : 'text-slate-600 group-hover:text-indigo-600'
                  }`}>
                  {m.nome}
                </span>
              </button>
            ))}
          </div>
        </div>

        <ModelosList
          agrupados={filteredAgrupados}
          loading={loading}
          onEdit={handleEdit}
        onDelete={handleClickInactivate}
        onReactivate={handleReactivate}
      />
      </div>

      {isFormOpen && (
        <ModeloForm
          initialData={editingModelo}
          isSaving={isSaving}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmModal
        isOpen={!!inactivateId}
        onClose={() => setInactivateId(null)}
        onConfirm={handleConfirmInactivate}
        title="Inativar Modelo?"
        message={`Deseja inativar o modelo "${getModeloNameById(inactivateId)}"? Ele não aparecerá mais em novos cadastros de estoque.`}
        confirmText="Sim, Inativar"
        variant="warning"
        isLoading={isInactivating}
      />
    </div>
  );
};

export default ModelosPage;
