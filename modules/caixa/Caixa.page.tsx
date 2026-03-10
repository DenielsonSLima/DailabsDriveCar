import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CaixaService } from './caixa.service';
import { EmpresaService } from '../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../ajustes/marca-dagua/marca-dagua.service';

// Componentes
import CaixaKpis from './components/CaixaKpis';
// PDF Components
import RelatoriosQuickPreview from '../relatorios/components/RelatoriosQuickPreview';
import CaixaTemplate from '../relatorios/templates/caixa/CaixaTemplate';

// Dashboard Components
import PerformanceChart from './components/PerformanceChart';
import AccountBalances from './components/AccountBalances';
import SocioSummary from './components/SocioSummary';
import SocioStockTable from './components/SocioStockTable';

const CaixaPage: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Fetch Available Months first to handle default selection
  const { data: availableMonths = [] } = useQuery({
    queryKey: ['caixa_available_months'],
    queryFn: () => CaixaService.getAvailableMonths(),
  });

  // Date State (Defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Ensure current month is always in the dropdown list, even if there are no transactions
  const allMonths = useMemo(() => {
    const now = new Date();
    const currentStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (availableMonths.length === 0) return [currentStr];
    if (!availableMonths.includes(currentStr)) {
      // Sort in descending order (newest first)
      return [currentStr, ...availableMonths].sort((a, b) => b.localeCompare(a));
    }
    return availableMonths;
  }, [availableMonths]);

  // Sync selectedMonth with most recent available month ONLY IF the URL/initial state is completely invalid
  // We no longer force it away from the current month if it's empty
  useEffect(() => {
    if (allMonths.length > 0 && !allMonths.includes(selectedMonth)) {
      setSelectedMonth(allMonths[0]);
    }
  }, [allMonths, selectedMonth]);

  const [showPreview, setShowPreview] = useState(false);

  const { startDate, endDate, formattedPeriod } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      formattedPeriod: `${start.toLocaleString('pt-BR', { month: 'long' })}/${year}`
    };
  }, [selectedMonth]);

  // Queries
  const { data, isLoading: isLoadingData, isFetching, error, refetch } = useQuery({
    queryKey: ['caixa_dashboard', startDate, endDate],
    queryFn: () => CaixaService.getDashboardData(startDate, endDate),
    placeholderData: keepPreviousData,
  });

  const { data: performanceHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['caixa_performance_history', selectedMonth],
    queryFn: () => CaixaService.getPerformanceHistory(selectedMonth),
    placeholderData: keepPreviousData,
  });

  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => EmpresaService.getDadosEmpresa(),
  });

  const { data: watermark } = useQuery({
    queryKey: ['watermark'],
    queryFn: () => MarcaDaguaService.getConfig(),
  });

  // Real-time Subscription
  useEffect(() => {
    const sub = CaixaService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['caixa_available_months'] });
      queryClient.invalidateQueries({ queryKey: ['caixa_performance_history'] });
    });
    return () => {
      CaixaService.unsubscribe(sub);
    };
  }, [queryClient]);

  const handlePrint = () => {
    window.print();
  };

  // Format ISO month string to "Mês/Ano" readable labels
  const formatMonthOption = (isoStr: string) => {
    const [y, m] = isoStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    const monthName = date.toLocaleString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${y}`;
  };

  if (isLoadingData || isLoadingHistory) return <div className="flex justify-center items-center h-full py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-[2rem] border border-rose-100 max-w-md text-center">
          <h2 className="text-lg font-black uppercase tracking-tighter mb-2">Erro ao carregar Caixa</h2>
          <p className="text-xs font-bold leading-relaxed">{(error as any).message || 'Ocorreu um erro inesperado ao processar os dados financeiros.'}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-8 animate-in fade-in duration-700 pb-20 ${isFetching && !isLoadingData ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Fluxo de Caixa & Patrimônio</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Consolidação de ativos, passivos e lucros</p>
          </div>
          {isFetching && !isLoadingData && (
            <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowPreview(true)}
            disabled={isLoadingData || !data}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Relatório PDF</span>
          </button>

          <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border-none text-[11px] font-bold text-slate-900 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer appearance-none min-w-[160px]"
            >
              {allMonths.length === 0 ? (
                <option value={selectedMonth}>{formatMonthOption(selectedMonth)}</option>
              ) : (
                allMonths.map(m => (
                  <option key={m} value={m}>
                    {formatMonthOption(m)}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {data && performanceHistory && (
        <div className="space-y-8">
          <CaixaKpis data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PerformanceChart history={performanceHistory} />
            </div>
            <div>
              <AccountBalances contas={data.contas || []} />
            </div>
          </div>

          <div className="pt-4">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Resumo de Sócios</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Visão consolidada de exposição e lucro por investidor</p>
            </div>
            <SocioSummary socios={data.investimento_socios || []} />
          </div>

          <div className="pt-4">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Detalhamento do Estoque</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Participação individual e exposição de capital por veículo</p>
            </div>
            <SocioStockTable socios={data.investimento_socios || []} />
          </div>


          {/* Standardized PDF Preview */}
          <RelatoriosQuickPreview
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title="Relatório Financeiro & Patrimônio"
          >
            <CaixaTemplate
              data={{ ...data, history: performanceHistory, socios: data.investimento_socios }}
              empresa={empresa}
              watermark={watermark}
              periodo={formattedPeriod}
            />
          </RelatoriosQuickPreview>
        </div>
      )}
    </div>
  );
};

export default CaixaPage;
