import React from 'react';
import { useNavigate } from 'react-router-dom';

interface RecentStockMiniProps {
  veiculos: any[];
}

const RecentStockMini: React.FC<RecentStockMiniProps> = ({ veiculos }) => {
  const navigate = useNavigate();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="dc-panel flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="dc-section-title">
            Últimas Chegadas
          </h3>
          <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mt-1">
            Veículos recém integrados ao estoque
          </p>
        </div>
        <button
          onClick={() => navigate('/estoque')}
          className="dc-button bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 rounded-lg text-xs font-semibold border border-slate-200"
        >
          Ver estoque
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 flex-1">
        {veiculos.length > 0 ? (
          veiculos.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/estoque/${v.id}`)}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-sm hover:border-indigo-300 transition-all duration-300 cursor-pointer flex flex-col h-full transform"
            >
              <div className="h-32 bg-slate-100 relative overflow-hidden shrink-0">
                {v.fotos?.[0] ? (
                  <img
                    src={typeof v.fotos[0] === 'string' ? v.fotos[0] : (v.fotos[0]?.url || '')}
                    alt={v.modelo?.nome || 'Veículo'}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-semibold normal-case tracking-normal mt-2">Sem Foto</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
                  <div className="px-3 py-1 bg-emerald-700 rounded-md text-xs font-semibold normal-case tracking-normal text-white shadow-sm">
                    {v.status || 'INDISPONÍVEL'}
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 z-10">
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200 text-xs font-mono font-semibold text-slate-700 shadow-sm normal-case">
                    {v.placa || 'SEM PLACA'}
                  </div>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-500 normal-case tracking-normal">
                      {v.ano_fabricacao || '----'}/{v.ano_modelo || '----'}
                    </span>
                    <span className="text-slate-300 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-500 normal-case">
                      {(v.km || 0).toLocaleString()} km
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 normal-case tracking-tight">
                    {v.montadora?.nome || ''} {v.modelo?.nome || 'Veículo'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5 normal-case tracking-wide">
                    {v.versao?.nome || 'Versão Base'}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-0.5">
                      Preço Venda
                    </p>
                    <p className="text-lg font-semibold text-emerald-700 tracking-tight">
                      {formatCurrency(Number(v.valor_venda) || 0)}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-500">
            <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-xs font-semibold normal-case tracking-normal">Sem veículos disponíveis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentStockMini;
