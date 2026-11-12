
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IVeiculo } from '../../estoque.types';
import { ICaracteristica } from '../../../cadastros/caracteristicas/caracteristicas.types';
import { IOpcional } from '../../../cadastros/opcionais/opcionais.types';

interface FeaturesCardProps {
  veiculo: IVeiculo;
  allCaracteristicas: ICaracteristica[];
  allOpcionais: IOpcional[];
}

const FeaturesCard: React.FC<FeaturesCardProps> = ({ veiculo, allCaracteristicas, allOpcionais }) => {
  const navigate = useNavigate();
  const tagsCaracteristicas = allCaracteristicas.filter(c => veiculo.caracteristicas_ids?.includes(c.id));
  const tagsOpcionais = allOpcionais.filter(o => veiculo.opcionais_ids?.includes(o.id));

  const handleEdit = () => {
    navigate(`/estoque/editar/${veiculo.id}`);
  };

  return (
    <div className="dc-panel bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-4">
       
       {/* 1. Características */}
       {tagsCaracteristicas.length > 0 && (
         <div className="mb-4">
           <h3 className="dc-section-title text-xs font-semibold text-indigo-500 normal-case tracking-normal mb-4 flex items-center">
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Destaques & Características
           </h3>
           <div className="flex flex-wrap gap-2">
             {tagsCaracteristicas.map(c => (
               <span key={c.id} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold normal-case tracking-normal border border-indigo-100 shadow-sm">
                 {c.nome}
               </span>
             ))}
           </div>
         </div>
       )}
       
       {(tagsCaracteristicas.length > 0 && tagsOpcionais.length > 0) && <div className="h-px bg-slate-100 mb-4"></div>}

       {/* 2. Opcionais */}
       {tagsOpcionais.length > 0 ? (
         <div className="mb-4">
           <h3 className="dc-section-title text-xs font-semibold text-slate-600 normal-case tracking-normal mb-4 flex items-center">
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
             Lista de Opcionais
           </h3>
           <div className="flex flex-wrap gap-2">
             {tagsOpcionais.map(o => (
               <span key={o.id} className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold normal-case tracking-normal shadow-sm">
                 {o.nome}
               </span>
             ))}
           </div>
         </div>
       ) : (
         <div className="mb-4 text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-xs text-slate-600 font-medium">Nenhum opcional cadastrado.</p>
         </div>
       )}

       <div className="h-px bg-slate-100 mb-4"></div>

       {/* 3. Observações com Botão */}
       <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="dc-section-title text-xs font-semibold text-amber-600 normal-case tracking-normal flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Observações Internas
            </h3>
            <button 
              onClick={handleEdit}
              className="dc-button text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              {veiculo.observacoes ? 'Editar Nota' : 'Adicionar Observação'}
            </button>
          </div>
          
          <div className={`rounded-2xl p-6 border transition-all ${veiculo.observacoes ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 border-dashed'}`}>
            {veiculo.observacoes ? (
              <p className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed font-medium opacity-90">
                {veiculo.observacoes}
              </p>
            ) : (
              <p className="text-slate-600 text-xs italic text-center py-2">
                Nenhuma observação registrada para este veículo.
              </p>
            )}
          </div>
       </div>
    </div>
  );
};

export default FeaturesCard;
