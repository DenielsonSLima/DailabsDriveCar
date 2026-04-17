import React from 'react';
import { IVisitorLocation } from '../../inicio.types';

interface Props {
  locations: IVisitorLocation[];
}

const VisitorLocationsCard: React.FC<Props> = ({ locations }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm flex flex-col h-full">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center mb-8">
        <span className="w-1.5 h-5 bg-purple-600 rounded-full mr-3"></span>
        Origem dos Clientes
      </h3>

      <div className="flex-1 space-y-6">
        {locations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-40">
            <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <p className="text-[10px] font-black uppercase tracking-widest">Aguardando dados...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((loc, idx) => (
              <div key={`${loc.city}-${loc.region}`} className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-700 uppercase tracking-widest">
                  <span>{loc.city || 'Desconhecido'}, {loc.region || '--'}</span>
                  <span className="text-orange-600">{loc.view_count}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full`}
                    style={{ 
                      width: `${Math.max(10, (loc.view_count / (locations[0]?.view_count || 1)) * 100)}%`,
                      opacity: 1 - (idx * 0.1)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
          * Dados aproximados com base no provedor de internet do visitante.
        </p>
      </div>
    </div>
  );
};

export default VisitorLocationsCard;
