import React from 'react';
import { ITopViewedVehicle } from '../../inicio.types';

interface Props {
  topVehicles: ITopViewedVehicle[];
}

const TopViewedVehiclesCard: React.FC<Props> = ({ topVehicles }) => {
  return (
    <div className="dc-panel relative overflow-hidden group">
      <div className="hidden"></div>
      
      <div className="relative flex items-center justify-between mb-8">
        <h3 className="text-sm font-semibold text-slate-900 normal-case tracking-normal flex items-center">
          <span className="w-1.5 h-5 bg-slate-500 rounded-full mr-3"></span>
          Ranking de Interesse (Top 5)
        </h3>
        <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Site Público</span>
      </div>

      <div className="relative space-y-4">
        {topVehicles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Nenhum dado registrado ainda</p>
          </div>
        ) : (
          topVehicles.map((v, idx) => (
            <div key={v.vehicle_id} className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-sm hover:shadow-slate-200/50 border border-transparent hover:border-slate-100 transition-all duration-300 group/item">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-semibold text-slate-900 shadow-sm border border-slate-100 group-hover/item:bg-slate-600 group-hover/item:text-white transition-colors">
                #{idx + 1}
              </div>
              
              <div className="w-16 h-12 rounded-xl overflow-hidden shadow-sm bg-slate-200 shrink-0">
                <img src={v.foto_url} alt={v.modelo_nome} className="w-full h-full object-cover transition-transform duration-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-orange-600 normal-case tracking-normal leading-none mb-1">{v.montadora_nome}</p>
                <h4 className="text-base font-semibold text-slate-900 normal-case tracking-tight truncate leading-none">{v.modelo_nome}</h4>
                <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mt-1">Placa: {v.placa}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xl font-semibold text-slate-900 tracking-tight leading-none">{v.view_count}</p>
                <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Visualizações</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopViewedVehiclesCard;
