import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { InicioService } from './inicio.service';
import { EmpresaService } from '../ajustes/empresa/empresa.service';

// Components
import WelcomeHeader from './components/WelcomeHeader';
import GeneralKpis from './components/GeneralKpis';
import RecentStockMini from './components/RecentStockMini';
import QuickShortcuts from './components/QuickShortcuts';
import { HistoryChart } from './components/HistoryChart';
import FipeUsageCard from './components/FipeUsageCard';
import SiteAnalyticsSection from './components/SiteAnalyticsSection';

const InicioPage: React.FC = () => {
  const queryClient = useQueryClient();

  // 0. Query para dados da Empresa (para obter organization_id correto do tenant)
  const { data: empresa } = useQuery({
    queryKey: ['empresa_config'],
    queryFn: () => EmpresaService.getDadosEmpresa(),
  });

  const orgId = empresa?.organization_id;

  // 1. Queries de Negócio (Estoque, Vendas, Histórico)
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['inicio_stats'],
    queryFn: () => InicioService.getDashboardStats(),
  });

  const { data: recent = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ['inicio_recent_arrivals'],
    queryFn: () => InicioService.getRecentArrivals(),
  });

  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['inicio_history_3'],
    queryFn: () => InicioService.getHistoryData(3),
  });

  // 2. Queries de Analytics (Tracking do Site Público) - Habilitado quando temos o orgId
  const { data: analyticsSummary } = useQuery({
    queryKey: ['site_analytics_summary', orgId],
    queryFn: () => InicioService.getSiteAnalyticsSummary(orgId!),
    enabled: !!orgId,
  });

  const { data: topVehicles = [] } = useQuery({
    queryKey: ['site_top_vehicles', orgId],
    queryFn: () => InicioService.getTopViewedVehicles(orgId!),
    enabled: !!orgId,
  });

  const { data: visitorLocations = [] } = useQuery({
    queryKey: ['site_visitor_locations', orgId],
    queryFn: () => InicioService.getVisitorLocations(orgId!),
    enabled: !!orgId,
  });

  // Real-time Subscriptions
  useEffect(() => {
    const channel = InicioService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['inicio_stats'] });
      queryClient.invalidateQueries({ queryKey: ['inicio_recent_arrivals'] });
      queryClient.invalidateQueries({ queryKey: ['inicio_history_3'] });
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: ['site_analytics_summary', orgId] });
        queryClient.invalidateQueries({ queryKey: ['site_top_vehicles', orgId] });
        queryClient.invalidateQueries({ queryKey: ['site_visitor_locations', orgId] });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, orgId]);

  const loading = isLoadingStats || isLoadingRecent || isLoadingHistory;

  if (loading) return (
    <div className="min-h-[320px] flex flex-col items-center justify-center">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-4 border-indigo-50/50 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-slate-500 font-semibold normal-case text-xs tracking-normal animate-pulse">Carregando visão geral...</p>
    </div>
  );

  return (
    <div className="dc-page pb-8 animate-in fade-in duration-200">
      {/* 1. Welcome Header (Premium) */}
      <WelcomeHeader />

      {/* 2. General KPIs (Full Width) */}
      {stats && <GeneralKpis stats={stats} />}

      {/* Operações frequentes ficam próximas dos indicadores, sem promover integrações. */}
      <QuickShortcuts />

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <HistoryChart data={history} />
        </div>
        <FipeUsageCard />
      </div>

      <RecentStockMini veiculos={recent} />

      {/* 4. Analytics Section (Novidade: Rastreamento do Site Público) - Agora no FINAL da página */}
      {analyticsSummary && (
        <SiteAnalyticsSection 
          summary={analyticsSummary}
          topVehicles={topVehicles}
          locations={visitorLocations}
        />
      )}
    </div>
  );
};

export default InicioPage;
