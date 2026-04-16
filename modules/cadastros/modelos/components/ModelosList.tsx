
import React from 'react';
import { IModelosAgrupados, IModelo } from '../modelos.types';

interface ListProps {
  agrupados: IModelosAgrupados;
  loading: boolean;
  onEdit: (m: IModelo) => void;
  onDelete: (id: string) => void;
  onReactivate?: (id: string) => void;
}

const ModelosList: React.FC<ListProps> = ({ agrupados, loading, onEdit, onDelete, onReactivate }) => {
  const montadoras = Object.keys(agrupados).sort();

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando Catálogo...</p>
      </div>
    );
  }

  if (montadoras.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm font-medium">Nenhum modelo encontrado para os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {montadoras.map(nome => {
        const { montadora, modelos } = agrupados[nome];
        return (
          <div key={montadora.id} className="animate-in slide-in-from-bottom-4 duration-500">
            {/* Header da Montadora */}
            <div className="flex items-center space-x-4 mb-6 sticky top-16 bg-white/80 backdrop-blur-md py-2 z-10">
              <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2 shadow-sm">
                {montadora.logo_url ? (
                  <img src={montadora.logo_url} alt={montadora.nome} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-slate-300 font-black text-xl">{montadora.nome.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{montadora.nome}</h3>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">
                  {modelos.length} {modelos.length === 1 ? 'Modelo Encontrado' : 'Modelos Encontrados'}
                </p>
              </div>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            {/* Grid de Modelos - Ajustado para cards mais largos (3-4 colunas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {modelos.map(modelo => {
                const isInactive = modelo.ativo === false;
                return (
                  <div 
                    key={modelo.id}
                    className={`group bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 flex flex-col ${isInactive ? 'opacity-75 grayscale-[0.3]' : ''}`}
                  >
                    {/* Foto do Modelo */}
                    <div className="h-48 bg-slate-50 flex items-center justify-center relative overflow-hidden group-hover:bg-white transition-colors">
                      {modelo.foto_url ? (
                        <img src={modelo.foto_url} alt={modelo.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      
                      {/* Ações Hover */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                        {!isInactive ? (
                          <>
                            <button 
                              onClick={() => onEdit(modelo)}
                              className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110 shadow-lg"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => onDelete(modelo.id)}
                              className="p-4 bg-white text-amber-600 rounded-2xl hover:bg-amber-600 hover:text-white transition-all transform hover:scale-110 shadow-lg"
                              title="Inativar"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => onReactivate?.(modelo.id)}
                            className="p-4 bg-white text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all transform hover:scale-110 shadow-lg"
                            title="Reativar"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        )}
                      </div>

                    {/* Badge de Tipo no Topo do Card */}
                    {modelo.tipo_veiculo && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-indigo-50">
                          {modelo.tipo_veiculo.nome}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 text-center">
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl">{modelo.nome}</h4>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Especificação Técnica</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModelosList;
