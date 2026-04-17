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
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-pulse h-[200px]">
      <div className="h-4 w-32 bg-slate-100 rounded-full mb-4"></div>
      <div className="h-8 w-full bg-slate-50 rounded-2xl mb-8"></div>
    </div>
  );

  const used = stats?.used || 0;
  const limit = stats?.limit || 100;
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
      {/* Background Icon Decor */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
        <TrendingUp className="w-40 h-40 text-indigo-600" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
               <TrendingUp className="w-5 h-5" />
             </div>
             <div>
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Consumo Fipe</h4>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Limite Mensal</p>
             </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900">{used}</span>
            <span className="text-xs font-bold text-slate-300 ml-1">/ {limit}</span>
          </div>
        </div>

        {/* Barra de Progresso Dinâmica (Verde -> Amarelo -> Vermelho) */}
        <div className="h-4 w-full bg-slate-100 rounded-full border border-slate-200/50 p-0.5 mb-6">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${
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
          <div className="flex-1 flex items-start gap-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
             <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
             <p className="text-[11px] font-semibold text-indigo-900/80 leading-relaxed">
               Este é um limite mensal de segurança. Consultas que excederem o limite de {limit} poderão ter <span className="text-indigo-600 font-black underline">custos adicionais</span>. Caso precise de mais créditos, entre em contato imediatamente.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FipeUsageCard;
