
import React from 'react';
import { IVeiculo } from '../../../../../estoque/estoque.types';
import { ICaracteristica } from '../../../../../cadastros/caracteristicas/caracteristicas.types';
import { IOpcional } from '../../../../../cadastros/opcionais/opcionais.types';

interface Props {
  veiculo: IVeiculo;
  allCaracteristicas: ICaracteristica[];
  allOpcionais: IOpcional[];
}

const VehicleMediaColumn: React.FC<Props> = ({ veiculo, allCaracteristicas, allOpcionais }) => {
  const capaUrl = veiculo.fotos?.find(f => f.is_capa)?.url || veiculo.fotos?.[0]?.url;
  const tagsCar = allCaracteristicas.filter(c => veiculo.caracteristicas_ids?.includes(c.id));
  const tagsOp = allOpcionais.filter(o => veiculo.opcionais_ids?.includes(o.id));

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-100 overflow-hidden relative">
      {/* Imagem com Proporção Controlada (Fixando 380x280 para evitar estiramento) */}
      <div className="w-full h-[280px] bg-slate-900 relative shrink-0 overflow-hidden shadow-sm">
        {capaUrl ? (
          <img src={capaUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Veículo" />
        ) : (
          <div className="w-full h-full bg-slate-200 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-xs font-semibold normal-case tracking-normal mt-2">Nenhuma Mídia</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

        {/* Badge do Status/Placa flutuante na imagem */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl text-xs font-semibold text-slate-900 shadow-sm normal-case font-mono">
            {veiculo.placa || 'SEM PLACA'}
          </div>
        </div>
      </div>

      {/* Tags Section (Abaixo da Imagem) - Mantendo proporção correta */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-white/50 backdrop-blur-sm">
        <div className="space-y-5">
          {/* Características */}
          {tagsCar.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal mb-2.5 flex items-center">
                <span className="w-1 h-1 bg-indigo-500 rounded-full mr-1.5"></span>
                Destaques Principais
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tagsCar.map(c => (
                  <span key={c.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100 normal-case tracking-normal shadow-sm">{c.nome}</span>
                ))}
              </div>
            </div>
          )}

          {/* Opcionais */}
          {tagsOp.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-2.5 flex items-center">
                <span className="w-1 h-1 bg-slate-400 rounded-full mr-1.5"></span>
                Opcionais
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tagsOp.map(o => (
                  <span key={o.id} className="px-2 py-1 bg-white text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 normal-case tracking-normal shadow-sm">{o.nome}</span>
                ))}
              </div>
            </div>
          )}

          {tagsCar.length === 0 && tagsOp.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
              <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-xs font-semibold normal-case tracking-normal text-slate-400">Checklist Pendente</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleMediaColumn;
