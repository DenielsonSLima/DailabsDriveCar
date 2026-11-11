import React from 'react';

interface Props {
  label: string;
  valor: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange';
}

const AnalyticsKpiCard: React.FC<Props> = ({ label, valor, icon, color }) => {
  const colorMap = {
    blue: 'from-blue-500/5 to-blue-500/0 text-blue-600 border-blue-100',
    purple: 'from-purple-500/5 to-purple-500/0 text-purple-600 border-purple-100',
    orange: 'from-orange-500/5 to-orange-500/0 text-orange-600 border-orange-100',
  };

  return (
    <div className="relative bg-white rounded-xl min-w-0 p-4 sm:p-5 border border-slate-200/60 shadow-sm hover:shadow-sm transition-all duration-500 group overflow-hidden">
      <div className={`hidden ${colorMap[color]} opacity-50`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-9 h-9 shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm transition-transform duration-500 text-slate-600`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-500 normal-case tracking-normal leading-none mb-1">{label}</h3>
          <p className="text-xl font-semibold text-slate-900 tracking-tight leading-none">{valor}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsKpiCard;
