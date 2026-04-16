import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Car, 
  Info, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Calendar,
  History,
  Hash,
  Tag,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { consultaPlacaService, FipeUsageStats, VeiculoConsultaReponse } from '../../ajustes/consulta-placa/consulta-placa.service';

interface FipeConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FipeConsultModal: React.FC<FipeConsultModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FipeUsageStats | null>(null);
  const [result, setResult] = useState<VeiculoConsultaReponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (isOpen) {
      loadStats();
    } else {
      setResult(null);
      setPlaca('');
      setCurrentPage(1);
    }
  }, [isOpen]);

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

  const handleConsultar = async () => {
    if (!placa || placa.length < 7) {
      showToast('error', 'Informe uma placa válida');
      return;
    }

    setLoading(true);
    try {
      const data = await consultaPlacaService.consultar(placa);
      setResult(data);
      setCurrentPage(1); // Resetar página em nova consulta bem sucedida
      loadStats(); 
      showToast('success', 'Placa consultada com sucesso!');
    } catch (error: any) {
      const isLimitError = error.message?.includes('limite') || error.message?.includes('LIMITE');
      
      if (isLimitError) {
        showToast('error', 'Você atingiu o seu limite de 100 consultas mensais.');
      } else {
        showToast('error', error.message || 'Erro ao consultar placa');
      }
    } finally {
      setLoading(false);
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
  
  const historico = vehicle?.historico || [];
  const totalPages = Math.ceil(historico.length / itemsPerPage);
  const paginatedHistory = historico.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />

      {toastData && (
        <div className={`fixed top-10 right-10 z-[250] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${
          toastData.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' :
          toastData.type === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-300' :
          'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${toastData.type === 'success' ? 'bg-emerald-400' : 'bg-white'}`} />
          <span className="font-bold text-sm tracking-tight">{toastData.message}</span>
        </div>
      )}
      
      <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        
        {/* Header Compacto */}
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
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Uso</span>
                <span className="text-[9px] font-black text-indigo-400">{stats?.used || 0}/{stats?.limit || 100}</span>
              </div>
              <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                  style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                />
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors border border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {!result ? (
            <div className="max-w-md mx-auto py-10 space-y-6 animate-in fade-in duration-500">
               <div className="text-center space-y-1">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter">QUAL A PLACA?</h2>
                 <p className="text-xs text-slate-400 font-medium">Consulte Fipe, Chassi e Histórico.</p>
               </div>

               <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-30 transition duration-700"></div>
                  <div className="relative flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-lg">
                    <div className="relative flex-1">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        disabled={loading || (stats?.remaining === 0)}
                        autoFocus
                        value={placa}
                        onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
                        placeholder="ABC1D23"
                        className="w-full bg-slate-50 border-none rounded-xl py-4 pl-11 pr-4 text-xl font-black text-slate-900 placeholder:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 transition-all uppercase font-mono"
                      />
                    </div>
                    <button 
                      disabled={loading || !placa || stats?.remaining === 0}
                      onClick={handleConsultar}
                      className="bg-slate-900 hover:bg-black disabled:opacity-50 text-white px-6 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-2 active:scale-95"
                    >
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Analisar <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
               </div>

               <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/30">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <p className="text-[9px] font-medium text-indigo-700/80 leading-tight uppercase tracking-tight">
                    Smart Cache Ativado: Consultas repetidas <span className="text-indigo-900 font-bold">não descontam do seu limite.</span>
                  </p>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Coluna Esquerda: Veículo e Specs */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[7px] font-black rounded uppercase tracking-widest border border-emerald-100">
                        Sucesso
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[7px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                        <History className="w-2.5 h-2.5" /> Fipe: {vehicle?.mesReferencia}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
                      {vehicle?.marca} <span className="text-indigo-600">{vehicle?.modelo}</span>
                    </h4>
                  </div>

                  {/* Grid de Dados Compacto */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Ano Modelo</span>
                      <div className="font-black text-slate-800 text-xs mt-0.5">{vehicle?.anoModelo}</div>
                    </div>
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Combustível</span>
                      <div className="font-black text-slate-800 text-xs mt-0.5 uppercase truncate">{vehicle?.combustivel}</div>
                    </div>
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Fipe</span>
                      <div className="font-black text-slate-800 text-xs mt-0.5">{vehicle?.codigoFipe}</div>
                    </div>
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Cor</span>
                      <div className="font-black text-slate-800 text-xs mt-0.5 uppercase">{vehicle?.cor || '—'}</div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-900 text-white rounded-[1.5rem] shadow-lg flex items-center justify-between">
                    <div>
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                        <TrendingUp className="w-2.5 h-2.5 text-indigo-400" /> Valuation Fipe
                      </span>
                      <div className="text-3xl font-black tracking-tighter">
                        {formatCurrency(vehicle?.valor || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Ano Fabr.</span>
                       <div className="text-lg font-bold">{vehicle?.anoFabricacao}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                    <div>
                      <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Chassi</label>
                      <div className="font-mono text-xs font-black text-slate-900 tracking-wider">
                        {vehicle?.chassi || 'NÃO INFORMADO'}
                      </div>
                    </div>
                    <span className="text-[7px] bg-slate-200 px-1.5 py-0.5 rounded font-black uppercase">{vehicle?.categoria || 'VEÍCULO'}</span>
                  </div>
                </div>

                {/* Coluna Direita: Histórico em Tabela com Paginação */}
                <div className="lg:col-span-12 xl:col-span-5 h-full">
                  <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm h-full flex flex-col min-h-[380px]">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                         <History className="w-4 h-4 text-indigo-600" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Histórico de Preços</span>
                      </div>
                      <a href={vehicle?.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    
                    <div className="flex-1 px-5 overflow-hidden">
                       <table className="w-full text-left">
                          <thead>
                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                              <th className="py-3">Mês/Ano</th>
                              <th className="py-3 text-right">Valor</th>
                              <th className="py-3 text-right">Var. %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {paginatedHistory.map((row, idx) => {
                              const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                              const nextRow = historico[globalIdx + 1];
                              const variation = nextRow ? calculateVariation(row.valor, nextRow.valor) : null;
                              const isPositive = variation && parseFloat(variation) > 0;
                              const isNegative = variation && parseFloat(variation) < 0;

                              return (
                                <tr key={idx} className={`text-[11px] font-bold ${globalIdx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                                  <td className="py-3.5 uppercase">{row.mes}</td>
                                  <td className="py-3.5 text-right">{formatCurrency(row.valor)}</td>
                                  <td className={`py-3.5 text-right flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-300'}`}>
                                    {variation ? (
                                      <>
                                        {variation}% 
                                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : null}
                                      </>
                                    ) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                       </table>
                    </div>

                    {/* Controles de Paginação */}
                    {totalPages > 1 && (
                      <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                          className="p-2 rounded-lg hover:bg-white disabled:opacity-20 text-slate-400 transition-all border border-transparent hover:border-slate-200"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-6 h-6 rounded-lg text-[9px] font-black transition-all border ${
                                currentPage === i + 1 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                          className="p-2 rounded-lg hover:bg-white disabled:opacity-20 text-slate-400 transition-all border border-transparent hover:border-slate-200"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer de Ações */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => {
                    setResult(null);
                    setCurrentPage(1);
                  }}
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
    </div>
  );
};

export default FipeConsultModal;

