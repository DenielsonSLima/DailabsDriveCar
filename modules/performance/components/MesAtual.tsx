import React, { useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PerformanceService } from '../performance.service';
import PerformanceContent from './PerformanceContent';

const MesAtual: React.FC = () => {
  const queryClient = useQueryClient();

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['performance', startDate, endDate],
    queryFn: () => PerformanceService.getPerformanceData(startDate, endDate),
    retry: 1,
    placeholderData: keepPreviousData,
  });

  // Real-time Subscription for current month
  useEffect(() => {
    const sub = PerformanceService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['performance', startDate, endDate] });
    });
    return () => {
      PerformanceService.unsubscribe(sub);
    };
  }, [queryClient, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Calculando métricas do mês...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 max-w-lg text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase mb-2">Erro ao carregar performance</h3>
          <p className="text-sm text-slate-500 mb-6">Não conseguimos processar os dados deste período. Por favor, tente novamente.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['performance'] })}
            className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
          >
            Tentar Novamente
          </button>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-4 text-[10px] text-rose-400 font-mono">{(error as Error)?.message}</p>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const mesNome = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const periodoLabel = `Mês Atual — ${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}`;

  return (
    <div className={`transition-opacity duration-500 ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
      <PerformanceContent data={data} periodoLabel={periodoLabel} isFetching={isFetching && !isLoading} />
    </div>
  );
};

export default MesAtual;
