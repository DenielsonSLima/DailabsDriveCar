
import React from 'react';
import { IVeiculo } from '../../../estoque/estoque.types';
import PublicVehicleCard from '../../components/PublicVehicleCard';

interface Props {
  veiculos: IVeiculo[] | { [key: string]: IVeiculo[] };
  isGrouped: boolean;
}

const EstoquePublicoList: React.FC<Props> = ({ veiculos, isGrouped }) => {
  
  const renderGrid = (items: IVeiculo[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {items.map((v) => (
        <PublicVehicleCard key={v.id} veiculo={v} />
      ))}
    </div>
  );

  if (!isGrouped) {
    const list = veiculos as IVeiculo[];
    if (list.length === 0) {
      return (
        <div className="py-32 text-center bg-white rounded-2xl border border-slate-200 border-dashed animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Nenhum veículo encontrado</h3>
          <p className="text-slate-400 text-sm mt-2 font-medium">Tente ajustar seus filtros de busca ou marca.</p>
        </div>
      );
    }
    return renderGrid(list);
  }

  // Renderização Agrupada
  const groups = veiculos as { [key: string]: IVeiculo[] };
  const keys = Object.keys(groups).sort();

  if (keys.length === 0) {
    return <div className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">Nenhum resultado para os filtros selecionados.</div>;
  }

  return (
    <div className="space-y-16">
      {keys.map(groupName => (
        <div key={groupName} className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center space-x-6 mb-8">
            <div className="h-px flex-1 bg-slate-200"></div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              {groupName} <span className="text-slate-400 font-bold ml-2">({groups[groupName].length})</span>
            </h3>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          {renderGrid(groups[groupName])}
        </div>
      ))}
    </div>
  );
};

export default EstoquePublicoList;
