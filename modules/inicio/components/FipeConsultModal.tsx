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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />

      {/* Notificações Toast */}
      {toastData && (
        <div className={`fixed top-6 right-6 z-[100000] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${
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
      
      <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        
        {/* Header Orquestrador */}
        <div className="px-6 py-4 bg-slate-900 text-white relative flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-400/30">
              <Search className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black uppercase tracking-tighter">Valuation Express</h3>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Inteligência de Mercado</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2 mb-1">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Uso Loja</span>
                <span className="text-[9px] font-black text-indigo-400">{stats?.used || 0}/{stats?.limit || 100}</span>
              </div>
              <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                  style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                />
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors border border-slate-700">
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
                  className="px-8 py-4 rounded-xl border border-slate-100 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:bg-slate-50 transition-all"
                >
                  Nova Consulta
                </button>
                <div className="flex-1" />
                <button 
                  onClick={() => navigate(`/pedidos-compra/novo`, { 
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
                  })}
                  className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl flex items-center gap-3 active:scale-95"
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
