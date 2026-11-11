
import React from 'react';
import { IMontadora } from '../montadoras.types';

interface KpiProps {
  total: number;
}

const MontadorasKpis: React.FC<KpiProps> = ({ total }) => {

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-500 transition-all duration-200">
        <p className="text-slate-500 text-xs font-medium normal-case tracking-normal">Marcas no Catálogo</p>
        <div className="flex items-end justify-between mt-1">
          <h3 className="text-3xl font-semibold text-slate-900">{total}</h3>
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm shadow-none">
        <p className="text-slate-500 text-xs font-medium normal-case tracking-normal">Status da Base</p>
        <div className="flex items-center space-x-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-emerald-500 text-xs font-medium normal-case tracking-normal">Sincronizado</span>
        </div>
      </div>
    </div>
  );
};

export default MontadorasKpis;
