
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { IVeiculo } from './estoque.types';
import { EstoqueService } from './estoque.service';
import { PedidosCompraService } from '../pedidos-compra/pedidos-compra.service';
import { CoresService } from '../cadastros/cores/cores.service';
import { ICor } from '../cadastros/cores/cores.types';
import { DadosParsedAPI } from './utils/autoPreencherVeiculo';
import { MontadorasService } from '../cadastros/montadoras/montadoras.service';
import { TiposVeiculosService } from '../cadastros/tipos-veiculos/tipos-veiculos.service';
import { ModelosService } from '../cadastros/modelos/modelos.service';
import { IMontadora } from '../cadastros/montadoras/montadoras.types';
import { ITipoVeiculo } from '../cadastros/tipos-veiculos/tipos-veiculos.types';
import { IModelo } from '../cadastros/modelos/modelos.types';
import { IVersao } from '../cadastros/versoes/versoes.types';

// Cards Modulares
import FormCardGallery from './components/FormCardGallery';
import FormCardIdentification from './components/FormCardIdentification';
import FormCardFinance from './components/FormCardFinance';
import FormCardTechnical from './components/FormCardTechnical';
import FormCardChecklist from './components/FormCardChecklist';
import FormCardObservations from './components/FormCardObservations';

// Modais Wizard
import ModalNovoModelo from './components/ModalNovoModelo';
import ModalNovaVersao from './components/ModalNovaVersao';
import { VersaoPrefillData } from './components/ModalNovaVersao';

// ============================================================
// WIZARD: Modais de confirmação para montadora e tipo
// ============================================================

interface ModalConfirmMontadoraProps {
  nome: string;
  montadoras: IMontadora[];
  onConfirm: (m: IMontadora) => void;
  onClose: () => void;
}

const ModalConfirmMontadora: React.FC<ModalConfirmMontadoraProps> = ({ nome, montadoras, onConfirm, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [nomeFinal, setNomeFinal] = useState(nome);
  const [selectedMontadoraId, setSelectedMontadoraId] = useState<string>('');

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedMontadoraId) {
        const montadora = montadoras.find(m => m.id === selectedMontadoraId);
        if (montadora) {
          onConfirm(montadora);
          return;
        }
      }
      
      const montadora = await MontadorasService.save({ nome: nomeFinal.toUpperCase() });
      onConfirm(montadora);
    } catch (e: any) {
      alert('Erro ao cadastrar montadora: ' + (e.message || ''));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-6 pb-4 border-b border-slate-100">
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg mb-1">
            ⚡ Consulta de Placa
          </span>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Montadora</h2>
          <p className="text-xs text-slate-500 mt-1">Esta marca não foi identificada. Confirme para criar ou selecione uma existente.</p>
        </div>
        <div className="p-8 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Selecionar Existente</label>
            <select
              value={selectedMontadoraId}
              onChange={e => {
                setSelectedMontadoraId(e.target.value);
                if (e.target.value) setNomeFinal('');
                else setNomeFinal(nome);
              }}
              className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Nova Montadora --</option>
              {montadoras.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
          
          {!selectedMontadoraId && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 mt-4">Nome da Nova Montadora</label>
              <input
                type="text"
                value={nomeFinal}
                onChange={e => setNomeFinal(e.target.value.toUpperCase())}
                className="w-full border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2 mt-4">
            <button onClick={onClose} disabled={saving} className="px-6 py-3 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || (!selectedMontadoraId && !nomeFinal.trim())} className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</> : (selectedMontadoraId ? 'Confirmar' : 'Cadastrar Montadora')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModalConfirmTipoProps {
  tipos: ITipoVeiculo[];
  onConfirm: (t: ITipoVeiculo) => void;
  onClose: () => void;
}

const ModalConfirmTipo: React.FC<ModalConfirmTipoProps> = ({ tipos, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-6 pb-4 border-b border-slate-100">
          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg mb-1">
            ⚡ Consulta de Placa
          </span>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Tipo do Veículo</h2>
          <p className="text-xs text-slate-500 mt-1">Selecione o tipo de carroceria deste veículo.</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 gap-3">
            {tipos.map(tipo => (
              <button
                key={tipo.id}
                onClick={() => onConfirm(tipo)}
                className="px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-700 uppercase tracking-wide hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
              >
                {tipo.nome}
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
            <button onClick={onClose} className="px-6 py-3 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-xl">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const EstoqueFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id, pedidoId } = useParams();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cores, setCores] = useState<ICor[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [isConsignacao, setIsConsignacao] = useState(false);

  // === Wizard States ===
  const [wizardDados, setWizardDados] = useState<DadosParsedAPI | null>(null);
  const [wizardStep, setWizardStep] = useState<'montadora' | 'tipo' | 'modelo' | 'versao' | null>(null);
  const [wizardMontadora, setWizardMontadora] = useState<IMontadora | null>(null);
  const [wizardTipoId, setWizardTipoId] = useState<string>('');
  const [wizardModeloId, setWizardModeloId] = useState<string>('');
  const [tiposVeiculos, setTiposVeiculos] = useState<ITipoVeiculo[]>([]);
  const [montadoras, setMontadoras] = useState<IMontadora[]>([]);

  const [formData, setFormData] = useState<Partial<IVeiculo>>({
    status: 'PREPARACAO',
    fotos: [],
    km: 0,
    valor_custo: 0,
    valor_venda: 0,
    caracteristicas_ids: [],
    opcionais_ids: [],
    socios: [],
    placa: '',
    chassi: '',
    observacoes: '',
    ano_fabricacao: new Date().getFullYear(),
    ano_modelo: new Date().getFullYear(),
    ...(pedidoId ? { pedido_id: pedidoId } : {})
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [coresData, tiposData, montadorasData] = await Promise.all([
          CoresService.getAll(),
          TiposVeiculosService.getAll(),
          MontadorasService.getAll()
        ]);
        setCores(coresData);
        setTiposVeiculos(tiposData);
        setMontadoras(montadorasData);

        if (pedidoId) {
          try {
            const pedido = await PedidosCompraService.getById(pedidoId);
            if (pedido && pedido.forma_pagamento?.nome?.toLowerCase().includes('consigna')) {
              setIsConsignacao(true);
            }
          } catch (e) {
            console.error('Erro ao verificar pedido', e);
          }
        }

        if (id) {
          const veiculo = await EstoqueService.getById(id);
          if (veiculo) setFormData(veiculo);
        }
      } catch (error) {
        showToast('error', 'Erro ao carregar dados iniciais.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [id, pedidoId]);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const handleUpdateField = (updates: Partial<IVeiculo>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleBack = () => {
    if (pedidoId) {
      navigate(`/pedidos-compra/${pedidoId}`);
    } else {
      navigate(-1);
    }
  };

  // ============================================================
  // WIZARD: Fluxo de consulta de placa
  // ============================================================

  const handleConsultaPlaca = (dados: DadosParsedAPI) => {
    setWizardDados(dados);

    if (dados.precisaCriarMontadora) {
      // Step 1: Criar montadora
      setWizardStep('montadora');
    } else {
      // Montadora já existe, pular para tipo
      setWizardMontadora(dados.montadora);
      handleUpdateField({ montadora_id: dados.montadora!.id });
      iniciarStepTipo(dados);
    }
  };

  const handleMontadoraCriada = (montadora: IMontadora) => {
    setWizardMontadora(montadora);
    handleUpdateField({ montadora_id: montadora.id });
    // Update local montadoras array so the new one is available
    setMontadoras(prev => {
      if (!prev.find(m => m.id === montadora.id)) {
        return [...prev, montadora].sort((a, b) => a.nome.localeCompare(b.nome));
      }
      return prev;
    });
    queryClient.invalidateQueries({ queryKey: ['montadoras_all'] });
    iniciarStepTipo(wizardDados!);
  };

  const iniciarStepTipo = (dados: DadosParsedAPI) => {
    // Sempre pede confirmação do tipo (API não diferencia SEDAN/HATCH/PICKUP)
    setWizardStep('tipo');
  };

  const handleTipoConfirmado = (tipo: ITipoVeiculo) => {
    setWizardTipoId(tipo.id);
    handleUpdateField({ tipo_veiculo_id: tipo.id });

    // Verificar se modelo existe
    if (wizardDados!.precisaCriarModelo) {
      setWizardStep('modelo');
    } else {
      // Modelo existe, pular para versão
      setWizardModeloId(wizardDados!.modelo!.id);
      handleUpdateField({ modelo_id: wizardDados!.modelo!.id });
      setWizardStep('versao');
    }
  };

  const handleModeloCriado = (modelo: IModelo) => {
    setWizardModeloId(modelo.id);
    handleUpdateField({ modelo_id: modelo.id });
    queryClient.invalidateQueries({ queryKey: ['modelos_by_montadora_tipo'] });
    setWizardStep('versao');
  };

  const handleVersaoCriada = (versao: IVersao) => {
    handleUpdateField({
      versao_id: versao.id,
      motorizacao: versao.motorizacao,
      combustivel: versao.combustivel,
      transmissao: versao.transmissao,
      ano_fabricacao: versao.ano_fabricacao,
      ano_modelo: versao.ano_modelo,
    });
    queryClient.invalidateQueries({ queryKey: ['versoes_by_modelo'] });

    // Limpar wizard
    setWizardStep(null);
    setWizardDados(null);
    showToast('success', '✅ Veículo pré-preenchido com sucesso! Confira os dados e salve.');
  };

  const handleWizardCancel = () => {
    setWizardStep(null);
    setWizardDados(null);
    showToast('warning', 'Consulta de placa cancelada.');
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!formData.montadora_id || !formData.modelo_id || !formData.tipo_veiculo_id || !formData.versao_id) {
      showToast('error', "Preencha todos os campos obrigatórios (Marca, Modelo, Tipo e Versão).");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await EstoqueService.save(formData);

      queryClient.invalidateQueries({ queryKey: ['estoque_list'] });
      queryClient.invalidateQueries({ queryKey: ['estoque_stats'] });

      const targetPedidoId = pedidoId || formData.pedido_id;
      if (location.pathname.includes('/pedidos-compra/')) {
        navigate(`/pedidos-compra/${targetPedidoId}`);
      } else if (location.pathname.includes('/pedidos-venda/')) {
        navigate(`/pedidos-venda/${targetPedidoId}`);
      } else {
        navigate('/estoque');
      }
    } catch (e: any) {
      console.error(e);
      showToast('error', 'Erro ao salvar: ' + (e.message || 'Verifique o console para detalhes técnicos.'));
      setIsSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Dados para o prefill do modal de versão
  const versaoPrefill: VersaoPrefillData | undefined = wizardDados ? {
    nome: wizardDados.versaoNome,
    motorizacao: wizardDados.motorizacaoSugerida,
    combustivel: wizardDados.combustivel,
    ano_fabricacao: wizardDados.anoFabricacao,
    ano_modelo: wizardDados.anoModelo,
    fromAPI: true,
  } : undefined;

  return (
    <div className="pb-32 bg-slate-50 min-h-screen animate-in fade-in duration-500 relative">

      {toast && (
        <div className={`fixed top-6 right-6 z-[250] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' :
          toast.type === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-300' :
            'bg-rose-600 text-white border-rose-400/50'
          }`}>
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Toolbar Superior */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={handleBack} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {id ? 'Editar Veículo' : 'Adicionar Veículo'}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {pedidoId ? 'Contexto: Pedido de Compra' : 'Gestão de Estoque'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Ficha'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
        <FormCardGallery formData={formData} onChange={handleUpdateField} onNotification={showToast} />
        <FormCardIdentification formData={formData} onChange={handleUpdateField} />
        <FormCardFinance formData={formData} onChange={handleUpdateField} onNotification={showToast} isConsignacao={isConsignacao} />
        <FormCardTechnical formData={formData} cores={cores} onChange={handleUpdateField} onConsultaPlaca={handleConsultaPlaca} onNotification={showToast} />
        <FormCardChecklist formData={formData} onChange={handleUpdateField} />
        <FormCardObservations formData={formData} onChange={handleUpdateField} />
      </div>

      {/* ===== WIZARD MODAIS ===== */}

      {/* Step 1: Montadora */}
      {wizardStep === 'montadora' && wizardDados && (
        <ModalConfirmMontadora
          nome={wizardDados.marcaNome}
          montadoras={montadoras}
          onConfirm={handleMontadoraCriada}
          onClose={handleWizardCancel}
        />
      )}

      {/* Step 2: Tipo de Veículo */}
      {wizardStep === 'tipo' && (
        <ModalConfirmTipo
          tipos={tiposVeiculos}
          onConfirm={handleTipoConfirmado}
          onClose={handleWizardCancel}
        />
      )}

      {/* Step 3: Modelo */}
      {wizardStep === 'modelo' && wizardDados && wizardMontadora && (
        <ModalNovoModelo
          preselectedMontadoraId={wizardMontadora.id}
          preselectedTipoId={wizardTipoId}
          preselectedNome={wizardDados.modeloNome}
          onClose={() => {
            // Só cancela se o wizard ainda está no step 'modelo'
            // (se onSuccess já avançou para 'versao', não faz nada)
            setWizardStep(prev => {
              if (prev === 'modelo') {
                setWizardDados(null);
                showToast('warning', 'Consulta de placa cancelada.');
                return null;
              }
              return prev;
            });
          }}
          onSuccess={handleModeloCriado}
        />
      )}

      {/* Step 4: Versão */}
      {wizardStep === 'versao' && wizardModeloId && (
        <ModalNovaVersao
          modeloId={wizardModeloId}
          modeloNome={wizardDados?.modeloNome}
          onClose={() => {
            // Só cancela se o wizard ainda está no step 'versao'
            setWizardStep(prev => {
              if (prev === 'versao') {
                setWizardDados(null);
                showToast('warning', 'Consulta de placa cancelada.');
                return null;
              }
              return prev;
            });
          }}
          onSuccess={handleVersaoCriada}
          prefillData={versaoPrefill}
        />
      )}
    </div>
  );
};

export default EstoqueFormPage;
