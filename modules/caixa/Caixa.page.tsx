import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { CaixaService } from './caixa.service';
import { EmpresaService } from '../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../ajustes/marca-dagua/marca-dagua.service';

// Componentes
import CaixaKpis from './components/CaixaKpis';
import AccountsOverview from './components/AccountsOverview';
import SocioStockOverview from './components/SocioStockOverview';
import SocioPatrimonioCards from './components/SocioPatrimonioCards';
import MonthlyPerformance from './components/MonthlyPerformance';
import ComparativoMensalChart from './components/ComparativoMensalChart';
import QuickPreviewModal from './components/QuickPreviewModal';
import CaixaPrint from './components/CaixaPrint';

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

  const { data: comparativo } = useQuery({
    queryKey: ['caixa_comparativo', startDate, endDate],
    queryFn: () => CaixaService.getComparativoMensal(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

  // Compute month labels for the comparativo chart
  const { mesAtualLabel, mesAnteriorLabel } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const atual = new Date(year, month - 1, 1);
    const anterior = new Date(year, month - 2, 1);
    const fmtMonth = (d: Date) => {
      const name = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      return `${name.charAt(0).toUpperCase() + name.slice(1)}/${d.getFullYear()}`;
    };
    return { mesAtualLabel: fmtMonth(atual), mesAnteriorLabel: fmtMonth(anterior) };
  }, [selectedMonth]);

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
      queryClient.invalidateQueries({ queryKey: ['caixa_comparativo'] });
    });
    return () => {
      CaixaService.unsubscribe(sub);
    };
  }, [queryClient]);

  const handlePrint = () => {
    window.print();
  };

  const { transacoesEntrada, transacoesSaida } = useMemo(() => {
    if (!data?.transacoes) return { transacoesEntrada: [], transacoesSaida: [] };

    return {
      transacoesEntrada: data.transacoes.filter(t => t.tipo === 'ENTRADA'),
      transacoesSaida: data.transacoes.filter(t => t.tipo === 'SAIDA')
    };
  }, [data?.transacoes]);

  // Format ISO month string to "Mês/Ano" readable labels
  const formatMonthOption = (isoStr: string) => {
    const [y, m] = isoStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    const monthName = date.toLocaleString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${y}`;
  };

  if (isLoadingData) return <div className="flex justify-center items-center h-full py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

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
    <div className={`space-y-6 animate-in fade-in duration-700 pb-20 ${isFetching && !isLoadingData ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
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
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mês de Referência:</span>
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

      {data && (
        <>
          <CaixaKpis data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SocioStockOverview socios={data.investimento_socios} />
            </div>
            <div className="space-y-6">
              <AccountsOverview contas={data.contas} />
            </div>
          </div>

          <SocioPatrimonioCards socios={data.investimento_socios} />

          <MonthlyPerformance
            vendas={data.total_vendas_recebido}
            compras={data.total_compras}
            lucro={data.lucro_mensal}
            margem={data.margem_lucro}
          />

          {comparativo && (
            <ComparativoMensalChart
              comparativo={comparativo}
              mesAtualLabel={mesAtualLabel}
              mesAnteriorLabel={mesAnteriorLabel}
            />
          )}

          {/* MOVIMENTAÇÕES SEPARADAS POR TIPO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ENTRADAS */}
            <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden h-fit">
              <div className="px-5 py-3 border-b border-emerald-100 bg-emerald-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <h3 className="font-bold text-emerald-900 text-sm">Entradas (Crédito)</h3>
                </div>
                <span className="text-[10px] font-black text-emerald-600/50 uppercase tracking-widest">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total_entradas)}
                </span>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-slate-500">Data/Desc</th>
                      <th className="px-4 py-2 font-semibold text-slate-500 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {transacoesEntrada.map((t) => (
                      <tr key={t.id} className="hover:bg-emerald-50/30">
                        <td className="px-4 py-2 text-slate-600">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{t.descricao || 'Sem descrição'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(t.data_pagamento).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-bold text-right text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                        </td>
                      </tr>
                    ))}
                    {transacoesEntrada.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-slate-400 italic text-xs">
                          Nenhuma entrada registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SAÍDAS */}
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden h-fit">
              <div className="px-5 py-3 border-b border-rose-100 bg-rose-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                  <h3 className="font-bold text-rose-900 text-sm">Saídas (Débito)</h3>
                </div>
                <span className="text-[10px] font-black text-rose-600/50 uppercase tracking-widest">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total_saidas)}
                </span>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-slate-500">Data/Desc</th>
                      <th className="px-4 py-2 font-semibold text-slate-500 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {transacoesSaida.map((t) => (
                      <tr key={t.id} className="hover:bg-rose-50/30">
                        <td className="px-4 py-2 text-slate-600">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{t.descricao || 'Sem descrição'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(t.data_pagamento).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-bold text-right text-rose-600">
                          -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                        </td>
                      </tr>
                    ))}
                    {transacoesSaida.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-slate-400 italic text-xs">
                          Nenhuma saída registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


          <QuickPreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            onDownload={handlePrint}
            title="Relatório Financeiro"
          >
            <CaixaPrint
              data={data}
              empresa={empresa}
              watermark={watermark}
              periodo={formattedPeriod}
              forecast={[]}
            />
          </QuickPreviewModal>

          <div className="hidden print:block">
            <CaixaPrint
              data={data}
              empresa={empresa}
              watermark={watermark}
              periodo={formattedPeriod}
              forecast={[]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CaixaPage;
