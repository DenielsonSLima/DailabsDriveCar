import React from 'react';
import { 
  ISiteAnalyticsSummary, 
  ITopViewedVehicle, 
  IVisitorLocation 
} from '../inicio.types';

// Sub-components
import AnalyticsKpiCard from './sub-components/AnalyticsKpiCard';
import TopViewedVehiclesCard from './sub-components/TopViewedVehiclesCard';
import VisitorLocationsCard from './sub-components/VisitorLocationsCard';

interface SiteAnalyticsSectionProps {
  summary: ISiteAnalyticsSummary;
  topVehicles: ITopViewedVehicle[];
  locations: IVisitorLocation[];
}

const SiteAnalyticsSection: React.FC<SiteAnalyticsSectionProps> = ({ 
  summary, 
  topVehicles, 
  locations 
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header da Seção */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.4em]">Analytics Site Público</p>
          <h2 className="text-3xl font-[900] text-slate-900 uppercase tracking-tighter leading-none">Desempenho Online</h2>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atualizado em tempo real</p>
          <div className="flex items-center gap-1 justify-end mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      {/* KPIs Grid - Agora usando o componente especializado AnalyticsKpiCard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticsKpiCard 
          label="Visualizações Totais" 
          valor={summary.total_views.toLocaleString('pt-BR')} 
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
        <AnalyticsKpiCard 
          label="Visitantes Únicos" 
          valor={summary.unique_visitors.toLocaleString('pt-BR')} 
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <AnalyticsKpiCard 
          label="Acessos Hoje" 
          valor={summary.views_today.toLocaleString('pt-BR')} 
          color="orange"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Veículos Mais Vistos */}
        <div className="lg:col-span-8">
          <TopViewedVehiclesCard topVehicles={topVehicles} />
        </div>

        {/* Localização dos Visitantes */}
        <div className="lg:col-span-4">
          <VisitorLocationsCard locations={locations} />
        </div>
      </div>
    </div>
  );
};

export default SiteAnalyticsSection;
