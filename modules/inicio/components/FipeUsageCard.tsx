import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Info, ArrowUpRight } from 'lucide-react';
import { consultaPlacaService } from '../../ajustes/consulta-placa/consulta-placa.service';

const FipeUsageCard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['fipe_usage_stats'],
    queryFn: () => consultaPlacaService.fetchUsageStats(),
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  if (isLoading) return (
    <div className="dc-panel animate-pulse h-[200px]">
      <div className="h-4 w-32 bg-slate-100 rounded-full mb-4"></div>
      <div className="h-8 w-full bg-slate-50 rounded-2xl mb-8"></div>
    </div>
  );

  const used = stats?.used || 0;
  const limit = stats?.limit || 100;
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <div className="dc-panel relative overflow-hidden">
      {/* Background Icon Decor */}
      <div className="hidden">
        <TrendingUp className="w-40 h-40 text-slate-600" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
               <TrendingUp className="w-5 h-5" />
             </div>
             <div>
               <h4 className="text-sm font-semibold text-slate-900 normal-case tracking-tight">Consumo Fipe</h4>
               <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mt-0.5">Limite Mensal</p>
             </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-semibold text-slate-900">{used}</span>
            <span className="text-xs font-medium text-slate-500 ml-1">/ {limit}</span>
          </div>
        </div>

        {/* Barra de Progresso Dinâmica (Verde -> Amarelo -> Vermelho) */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full mb-4">
          <div 
            className={`h-full rounded-full transition-all duration-300 ease-out shadow-sm ${
              percentage < 60 
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-500/20' 
                : percentage < 85 
                ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-amber-500/20' 
                : 'bg-gradient-to-r from-rose-500 to-rose-700 shadow-rose-500/20'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 flex items-start gap-2 border-t border-slate-100 pt-4">
             <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
             <p className="text-xs font-normal text-slate-600 leading-relaxed">
               Este é um limite mensal de segurança. Consultas que excederem o limite de {limit} poderão ter <span className="text-slate-900 font-medium">custos adicionais</span>. Caso precise de mais créditos, entre em contato imediatamente.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FipeUsageCard;
