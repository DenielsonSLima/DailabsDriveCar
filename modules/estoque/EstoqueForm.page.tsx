
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { IVeiculo } from './estoque.types';
import { EstoqueService } from './estoque.service';
import { PedidosCompraService } from '../pedidos-compra/pedidos-compra.service';
import { CoresService } from '../cadastros/cores/cores.service';
import { ICor } from '../cadastros/cores/cores.types';

// Cards Modulares
import FormCardGallery from './components/FormCardGallery';
import FormCardIdentification from './components/FormCardIdentification';
import FormCardFinance from './components/FormCardFinance';
import FormCardTechnical from './components/FormCardTechnical';
import FormCardChecklist from './components/FormCardChecklist';
import FormCardObservations from './components/FormCardObservations';

const EstoqueFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id, pedidoId } = useParams();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cores, setCores] = useState<ICor[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [isConsignacao, setIsConsignacao] = useState(false);

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
        const [coresData] = await Promise.all([
          CoresService.getAll()
        ]);
        setCores(coresData);

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

  const handleSubmit = async () => {
    if (!formData.montadora_id || !formData.modelo_id || !formData.tipo_veiculo_id || !formData.versao_id || !formData.cor_id) {
      showToast('error', "Preencha todos os campos obrigatórios (Marca, Modelo, Tipo, Versão e Cor).");
      return;
    }

    setIsSaving(true);
    try {
      // O service agora cuida da limpeza dos campos modelo/montadora etc.
      const saved = await EstoqueService.save(formData);

      // Invalida queries do estoque para garantir atualização imediata
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
        <FormCardTechnical formData={formData} cores={cores} onChange={handleUpdateField} />
        <FormCardChecklist formData={formData} onChange={handleUpdateField} />
        <FormCardObservations formData={formData} onChange={handleUpdateField} />
      </div>
    </div>
  );
};

export default EstoqueFormPage;
