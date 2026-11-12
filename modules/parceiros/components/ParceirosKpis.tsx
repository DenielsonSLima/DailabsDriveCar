import React from 'react';
import { IParceirosStats } from '../parceiros.types';

interface KpiProps {
  stats: IParceirosStats;
}

const ParceirosKpis: React.FC<KpiProps> = ({ stats }) => {
  const statsList = [
    {
      label: 'Total Parceiros',
      value: stats.total,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
      color: 'indigo'
    },
    {
      label: 'Total Clientes',
      value: stats.clientes,
      icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      color: 'emerald'
    },
    {
      label: 'Fornecedores',
      value: stats.fornecedores,
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5',
      color: 'amber'
    },
    {
      label: 'Total Inativos',
      value: stats.inativos,
      icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636',
      color: 'rose'
    }
  ];

  return (
    <div className="dc-kpi-grid">
      {statsList.map((s, idx) => (
        <div key={idx} className="dc-kpi-card">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-sm`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
            </div>
          </div>
          <p className="dc-kpi-label">{s.label}</p>
          <h3 className="dc-kpi-value">{s.value}</h3>
        </div>
      ))}
    </div>
  );
};

export default ParceirosKpis;
