
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IVeiculo } from '../estoque.types';
import { ICor } from '../../cadastros/cores/cores.types';
import EstoqueCard from './EstoqueCard';

interface Props {
  groupedData: { [key: string]: IVeiculo[] } | IVeiculo[];
  isGrouped: boolean;
  cores: ICor[];
  onDelete: (id: string) => void;
}

const EstoqueList: React.FC<Props> = ({ groupedData, isGrouped, cores }) => {
  const navigate = useNavigate();
  const handleViewDetails = (id: string) => navigate(`/estoque/${id}`);

  if (!isGrouped) {
    const list = groupedData as IVeiculo[];
    if (list.length === 0) return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
        <p className="text-slate-400 font-bold normal-case text-xs tracking-normal">Nenhum veículo encontrado para os filtros atuais.</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
        {list.map(v => (
          <EstoqueCard 
            key={v.id} 
            veiculo={v} 
            cores={cores}
            onClick={() => handleViewDetails(v.id)} 
          />
        ))}
      </div>
    );
  }

  const groups = groupedData as { [key: string]: IVeiculo[] };
  const keys = Object.keys(groups).sort();

  return (
    <div className="space-y-12">
      {keys.map(groupName => (
        <div key={groupName} className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center space-x-4 mb-6 sticky top-20 bg-slate-50/90 backdrop-blur-sm py-3 z-10 rounded-xl px-2">
            <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
            <h3 className="text-xl font-semibold text-slate-900 normal-case tracking-normal">
              {groupName} <span className="text-sm font-medium text-slate-400 ml-2">({groups[groupName].length})</span>
            </h3>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {groups[groupName].map(v => (
              <EstoqueCard 
                key={v.id} 
                veiculo={v} 
                cores={cores}
                onClick={() => handleViewDetails(v.id)} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EstoqueList;
