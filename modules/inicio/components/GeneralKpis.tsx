import React from 'react';
import { IDashboardStats } from '../inicio.types';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface KpiCardProps {
  label: string;
  valor: string | number;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  sublabel?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, valor, icon, color, sublabel }) => {
  const colorMap = {
    indigo: 'from-indigo-500/5 to-indigo-500/0 text-indigo-600 border-indigo-100',
    emerald: 'from-emerald-500/5 to-emerald-500/0 text-emerald-600 border-emerald-100',
    amber: 'from-amber-500/5 to-amber-500/0 text-amber-600 border-amber-100',
    rose: 'from-rose-500/5 to-rose-500/0 text-rose-600 border-rose-100',
    slate: 'from-slate-500/5 to-slate-500/0 text-slate-600 border-slate-100',
  };

  return (
    <div className={`relative bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-50`} />

      <div className="relative flex items-center justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 ${colorMap[color].split(' ')[2]}`}>
          {icon}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Nexus KPI</span>
          <div className={`w-6 h-1 rounded-full bg-slate-100 group-hover:w-full transition-all duration-500`} />
        </div>
      </div>

      <div className="relative">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">{label}</h3>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate">
          {valor}
        </p>
        {sublabel && (
          <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
};

const GeneralKpis: React.FC<{ stats: IDashboardStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KpiCard
        label="Veículos em Estoque"
        valor={stats.totalEstoque}
        sublabel="Unidades Ativas"
        color="slate"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        }
      />
      <KpiCard
        label="Patrimônio em Estoque"
        valor={formatCurrency(stats.valorGlobalEstoque)}
        sublabel="Valor de Custo Total"
        color="emerald"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        }
      />
      <KpiCard
        label="Vendas (Mês Atual)"
        valor={stats.vendasMesAtual}
        sublabel={`${stats.vendasMesAtual} Registros`}
        color="indigo"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        }
      />
      <KpiCard
        label="Lucro Bruto Projetado"
        valor={formatCurrency(stats.lucroProjetado)}
        sublabel="Margem Estimada"
        color="amber"
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
    </div>
  );
};

export default GeneralKpis;
