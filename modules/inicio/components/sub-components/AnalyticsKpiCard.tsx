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
    <div className="relative bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-50`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 ${colorMap[color].split(' ')[2]}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</h3>
          <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{valor}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsKpiCard;
