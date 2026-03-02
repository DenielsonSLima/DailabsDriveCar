import React, { useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { PerformanceService } from '../performance.service';
import PerformanceContent from './PerformanceContent';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const OutrosMeses: React.FC = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  // Iniciar no mês anterior
  const mesAnterior = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const anoAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [mesSelecionado, setMesSelecionado] = useState(mesAnterior);
  const [anoSelecionado, setAnoSelecionado] = useState(anoAnterior);

  // Gerar lista de anos: do atual até 3 anos atrás
  const anos = Array.from({ length: 4 }, (_, i) => now.getFullYear() - i);

  const startDate = new Date(anoSelecionado, mesSelecionado, 1).toISOString().split('T')[0];
  const endDate = new Date(anoSelecionado, mesSelecionado + 1, 0).toISOString().split('T')[0];

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['performance', startDate, endDate],
    queryFn: () => PerformanceService.getPerformanceData(startDate, endDate),
    staleTime: 1000 * 60 * 10, // 10 minutes for historical data
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const periodoLabel = `${MESES[mesSelecionado]} de ${anoSelecionado}`;
  const isMesAtual = mesSelecionado === now.getMonth() && anoSelecionado === now.getFullYear();

  return (
    <div className="space-y-6">
      {/* Seletor de Mês/Ano */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/80 p-1.5">
          {MESES.map((mes, idx) => {
            const isFuturo = anoSelecionado === now.getFullYear() && idx > now.getMonth();
            const isAtual = anoSelecionado === now.getFullYear() && idx === now.getMonth();
            return (
              <button
                key={idx}
                disabled={isFuturo}
                onClick={() => setMesSelecionado(idx)}
                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mesSelecionado === idx
                  ? 'bg-slate-900 text-white shadow-lg'
                  : isFuturo
                    ? 'text-slate-200 cursor-not-allowed'
                    : isAtual
                      ? 'text-indigo-500 hover:bg-indigo-50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {mes.slice(0, 3)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-200/80 p-1.5">
          {anos.map(ano => (
            <button
              key={ano}
              onClick={() => {
                setAnoSelecionado(ano);
                // Se o mês selecionado é futuro no novo ano, ajustar
                if (ano === now.getFullYear() && mesSelecionado > now.getMonth()) {
                  setMesSelecionado(now.getMonth());
                }
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${anoSelecionado === ano
                ? 'bg-slate-900 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              {ano}
            </button>
          ))}
        </div>
      </div>

      {/* Aviso mês atual */}
      {isMesAtual && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Este é o mês atual. Use a aba "Mês Atual" para dados em tempo real.</span>
        </div>
      )}

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Carregando {periodoLabel}...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 min-h-[400px]">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 max-w-lg text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase mb-2">Erro ao carregar histórico</h3>
            <p className="text-sm text-slate-500 mb-6">Não conseguimos processar os dados de {periodoLabel}.</p>
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
      ) : data ? (
        <div className={`transition-opacity duration-500 ${isFetching && !isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <PerformanceContent data={data} periodoLabel={periodoLabel} isFetching={isFetching && !isLoading} />
        </div>
      ) : null}
    </div>
  );
};

export default OutrosMeses;
