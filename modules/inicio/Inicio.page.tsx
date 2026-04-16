import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { InicioService } from './inicio.service';

// Components
import WelcomeHeader from './components/WelcomeHeader';
import GeneralKpis from './components/GeneralKpis';
import RecentStockMini from './components/RecentStockMini';
import QuickShortcuts from './components/QuickShortcuts';
import { HistoryChart } from './components/HistoryChart';
import FipeUsageCard from './components/FipeUsageCard';

const InicioPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
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

  // Real-time Subscriptions
  useEffect(() => {
    const channel = InicioService.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['inicio_stats'] });
      queryClient.invalidateQueries({ queryKey: ['inicio_recent_arrivals'] });
      queryClient.invalidateQueries({ queryKey: ['inicio_history_3'] });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const loading = isLoadingStats || isLoadingRecent || isLoadingHistory;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center -mt-20">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-50/50 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Orquestrando Nexus Core...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* 1. Welcome Header (Premium) */}
      <WelcomeHeader />

      {/* 2. General KPIs (Full Width) */}
      {stats && <GeneralKpis stats={stats} />}

      {/* 3. Main Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left: Chart & Stock */}
        <div className="xl:col-span-8 space-y-8">
          {/* Historical Data visualization */}
          <HistoryChart data={history} />

          {/* Recent Vehicles */}
          <RecentStockMini veiculos={recent} />
        </div>
        {/* Right: Operations & Activity */}
        <div className="xl:col-span-4 space-y-8">
          {/* Fipe Usage Monitoring */}
          <FipeUsageCard />

          <QuickShortcuts />

          {/* Marketing Shortcut Card */}
          <div
            onClick={() => navigate('/marketing/stories')}
            className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-9 text-white shadow-2xl relative overflow-hidden group hover:shadow-indigo-500/20 transition-all duration-500 cursor-pointer border border-white/10"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
              <svg className="w-44 h-44" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6">
                <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100">Marketing Nexus</span>
              </div>
              <h4 className="text-2xl font-black tracking-tight leading-tight">Gerador de Stories</h4>
              <p className="mt-4 text-white/70 text-sm font-medium leading-relaxed">
                Transforme as fotos do seu estoque em posts profissionais para o Instagram em segundos.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="bg-white text-indigo-600 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-center shadow-lg shadow-indigo-900/20 group-hover:bg-indigo-50 transition-colors">
                  Criar Story 9:16
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Feed Card */}
          <div
            onClick={() => navigate('/marketing/feed')}
            className="bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 rounded-[2.5rem] p-9 text-white shadow-2xl relative overflow-hidden group hover:shadow-fuchsia-500/20 transition-all duration-500 cursor-pointer border border-white/10"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:-rotate-12 group-hover:scale-110 transition-all duration-700">
              <svg className="w-44 h-44" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 13h-2v-2h2v2zm0-4h-2V7h2v5z" />
              </svg>
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6">
                <div className="w-1.5 h-1.5 bg-fuchsia-300 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-fuchsia-100">Social Media</span>
              </div>
              <h4 className="text-2xl font-black tracking-tight leading-tight">Gerador de Feed</h4>
              <p className="mt-4 text-white/70 text-sm font-medium leading-relaxed">
                Gere posts quadrados ou verticais (4:5) automáticos com o logo da loja e dados do veículo.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="bg-white text-fuchsia-600 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-center shadow-lg shadow-fuchsia-900/20 group-hover:bg-fuchsia-50 transition-colors">
                  Criar Post 4:5
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InicioPage;
