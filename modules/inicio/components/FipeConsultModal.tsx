import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  CheckCircle2, 
  CloudLightning,
  BarChart3,
  Database
} from 'lucide-react';

import { 
  consultaPlacaService, 
  FipeUsageStats, 
  VeiculoConsultaReponse 
} from '../../ajustes/consulta-placa/consulta-placa.service';

// Sub-componentes Refatorados
import FipeSearchForm from './sub-components/FipeSearchForm';
import FipeAnalysisLoading from './sub-components/FipeAnalysisLoading';
import FipeResultDetails from './sub-components/FipeResultDetails';
import FipeHistoryTable from './sub-components/FipeHistoryTable';

interface FipeConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FipeConsultModal: React.FC<FipeConsultModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stats, setStats] = useState<FipeUsageStats | null>(null);
  const [result, setResult] = useState<VeiculoConsultaReponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    { label: 'Estabelecendo conexão segura...', icon: CloudLightning },
    { label: 'Verificando Smart Cache...', icon: Database },
    { label: 'Consultando API Brasil (Fipe/Chassi)...', icon: Search },
    { label: 'Analisando depreciação de mercado...', icon: BarChart3 },
    { label: 'Gerando relatório detalhado...', icon: CheckCircle2 }
  ];

  useEffect(() => {
    if (isOpen) {
      loadStats();
    } else {
      setResult(null);
      setPlaca('');
      setCurrentPage(1);
      stopLoadingSimulation();
    }
    return () => stopLoadingSimulation(); // Cleanup on unmount
  }, [isOpen]);

  const startLoadingSimulation = () => {
    setLoadingStep(0);
    setLoadingProgress(0);
    let currentStep = 0;
    let progress = 0;

    loadingIntervalRef.current = setInterval(() => {
      progress += Math.random() * 8;
      if (progress > 95) progress = 95;
      setLoadingProgress(progress);

      const nextStep = Math.floor((progress / 100) * steps.length);
      if (nextStep > currentStep && nextStep < steps.length) {
        currentStep = nextStep;
        setLoadingStep(currentStep);
      }
    }, 400);
  };

  const stopLoadingSimulation = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

  const loadStats = async () => {
    try {
      const s = await consultaPlacaService.fetchUsageStats();
      setStats(s);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const [toastData, setToastData] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToastData({ type, message });
    setTimeout(() => setToastData(null), 4500);
  };

  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleConsultar = async () => {
    if (!placa || placa.length < 7) {
      showToast('error', 'Informe uma placa válida');
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    startLoadingSimulation();

    try {
      const data = await consultaPlacaService.consultar(placa);
      setLoadingProgress(100);
      setLoadingStep(steps.length - 1);
      
      setTimeout(() => {
        setResult(data);
        setCurrentPage(1);
        loadStats(); 
        setLoading(false);
        stopLoadingSimulation();
        showToast('success', 'Placa consultada com sucesso!');
      }, 500);

    } catch (error: any) {
      console.error('Erro no handleConsultar:', error);
      stopLoadingSimulation();
      setLoading(false);
      const msg = error.message || 'Erro ao consultar placa';
      setErrorStatus(msg);
      setResult(null); 
      showToast('error', msg);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const calculateVariation = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const diff = ((current - previous) / previous) * 100;
    return diff.toFixed(1);
  };

  if (!isOpen) return null;

  const usedPercentage = stats ? (stats.used / stats.limit) * 100 : 0;
  const vehicle = result?.data?.resultados?.[0];
  
  return createPortal(
    <div data-drivecar-ui className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />

      {/* Notificações Toast */}
      {toastData && (
        <div className={`fixed top-6 right-6 z-[100000] px-6 py-4 rounded-2xl shadow-sm flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-sm ${
          toastData.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' :
          toastData.type === 'warning' ? 'bg-slate-900/95 text-white border-amber-500/50' :
          'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            toastData.type === 'success' ? 'bg-emerald-400' : 
            toastData.type === 'warning' ? 'bg-amber-400' :
            'bg-white'
          }`} />
          <span className="font-bold text-sm tracking-tight">{toastData.message}</span>
        </div>
      )}
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-white overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        
        {/* Header Orquestrador */}
        <div className="px-6 py-4 bg-slate-50 text-slate-900 border-b border-slate-200 relative flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
              <Search className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold normal-case tracking-tight">Valuation Express</h3>
              </div>
              <p className="text-xs font-bold text-slate-500 normal-case tracking-normal leading-none">Inteligência de Mercado</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Uso Loja</span>
                <span className="text-xs font-semibold text-indigo-600">{stats?.used || 0}/{stats?.limit || 100}</span>
              </div>
              <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                />
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {!result ? (
            loading ? (
              <FipeAnalysisLoading 
                progress={loadingProgress} 
                currentStep={loadingStep} 
                steps={steps} 
              />
            ) : (
              <FipeSearchForm 
                placa={placa} 
                setPlaca={setPlaca} 
                loading={loading} 
                onConsult={handleConsultar} 
                stats={stats}
                errorStatus={errorStatus}
              />
            )
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <FipeResultDetails 
                  vehicle={vehicle} 
                  placa={placa}
                  formatCurrency={formatCurrency} 
                />
                <FipeHistoryTable 
                  historico={vehicle?.historico || []} 
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  formatCurrency={formatCurrency}
                  calculateVariation={calculateVariation}
                  url={vehicle?.url}
                />
              </div>

              {/* Ações do Footer */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => { setResult(null); setCurrentPage(1); }}
                  className="px-8 py-4 rounded-xl border border-slate-100 text-slate-500 font-semibold normal-case text-xs tracking-normal hover:bg-slate-50 transition-all"
                >
                  Nova Consulta
                </button>
                <div className="flex-1" />
                <button 
                  onClick={() => {
                   const isMoto = vehicle?.categoria?.toLowerCase().includes('moto') || 
                                  vehicle?.extra?.categoria?.sintetico?.toLowerCase().includes('moto');

                   if (isMoto) {
                     const confirm = window.confirm(`⚠️ Atenção: Esta placa pertence a uma MOTO (${vehicle?.marca} ${vehicle?.modelo}). Deseja realmente iniciar um Pedido de Compra para este veículo?`);
                     if (!confirm) return;
                   }

                   navigate(`/pedidos-compra/novo`, { 
                    state: { 
                      vehicleData: {
                        placa,
                        marca: vehicle?.marca,
                        modelo: vehicle?.modelo,
                        anoFabricacao: vehicle?.anoFabricacao,
                        anoModelo: vehicle?.anoModelo,
                        combustivel: vehicle?.combustivel,
                        chassi: vehicle?.chassi,
                        codigoFipe: vehicle?.codigoFipe,
                        valorFipe: vehicle?.valor,
                        cor: vehicle?.cor,
                        categoria: vehicle?.categoria
                      } 
                    } 
                   });
                  }}
                  className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-xl font-semibold normal-case text-xs tracking-normal transition-all shadow-sm flex items-center gap-3 "
                >
                  Iniciar Pedido de Compra <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FipeConsultModal;
