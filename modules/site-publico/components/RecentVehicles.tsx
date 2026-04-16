import React from 'react';
import { Link } from 'react-router-dom';
import { IVeiculo } from '../../estoque/estoque.types';
import PublicVehicleCard from './PublicVehicleCard';

interface Props {
  veiculos: IVeiculo[];
}

const RecentVehicles: React.FC<Props> = React.memo(({ veiculos }) => {
  const hasVeiculos = veiculos && veiculos.length > 0;

  if (!hasVeiculos) return null;

  return (
    <section id="estoque" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <p className="text-orange-600 text-[10px] font-black uppercase tracking-[0.6em] mb-2">Disponibilidade Imediata</p>
            <h2 className="text-5xl font-[900] text-slate-900 uppercase tracking-tighter leading-none">Recém Chegados</h2>
          </div>
          <Link to="/estoque-publico" className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm active:scale-95">
            Ver Pátio Completo
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {veiculos.slice(0, 8).map((v) => (
            <div key={v.id} className="animate-in fade-in zoom-in-95 duration-700">
              <PublicVehicleCard veiculo={v} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

RecentVehicles.displayName = 'RecentVehicles';

export default RecentVehicles;