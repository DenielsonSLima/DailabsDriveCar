import React from 'react';
import { ITopViewedVehicle } from '../../inicio.types';

interface Props {
  topVehicles: ITopViewedVehicle[];
}

const TopViewedVehiclesCard: React.FC<Props> = ({ topVehicles }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:bg-orange-50 transition-colors duration-700"></div>
      
      <div className="relative flex items-center justify-between mb-8">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
          <span className="w-1.5 h-5 bg-orange-600 rounded-full mr-3"></span>
          Ranking de Interesse (Top 5)
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Público</span>
      </div>

      <div className="relative space-y-4">
        {topVehicles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum dado registrado ainda</p>
          </div>
        ) : (
          topVehicles.map((v, idx) => (
            <div key={v.vehicle_id} className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-transparent hover:border-slate-100 transition-all duration-300 group/item">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-900 shadow-sm border border-slate-100 group-hover/item:bg-orange-600 group-hover/item:text-white transition-colors">
                #{idx + 1}
              </div>
              
              <div className="w-16 h-12 rounded-xl overflow-hidden shadow-sm bg-slate-200 shrink-0">
                <img src={v.foto_url} alt={v.modelo_nome} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1">{v.montadora_nome}</p>
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tighter truncate leading-none">{v.modelo_nome}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Placa: {v.placa}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{v.view_count}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visualizações</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopViewedVehiclesCard;
