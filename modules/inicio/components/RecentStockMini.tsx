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
    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 flex flex-col">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase px-1 border-l-4 border-indigo-500">
            Últimas Chegadas
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Veículos recém integrados ao estoque
          </p>
        </div>
        <button
          onClick={() => navigate('/estoque')}
          className="bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100"
        >
          Ver Estoque Full
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {veiculos.length > 0 ? (
          veiculos.map((v) => (
            <div
              key={v.id}
              onClick={() => navigate(`/estoque/${v.id}`)}
              className="group bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden shrink-0">
                {v.fotos?.[0] ? (
                  <img
                    src={typeof v.fotos[0] === 'string' ? v.fotos[0] : (v.fotos[0]?.url || '')}
                    alt={v.modelo?.nome || 'Veículo'}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Sem Foto</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
                  <div className="px-3 py-1 bg-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                    {v.status || 'INDISPONÍVEL'}
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 z-10">
                  <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-md border border-slate-200 text-[10px] font-mono font-bold text-slate-700 shadow-sm uppercase">
                    {v.placa || 'SEM PLACA'}
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                      {v.ano_fabricacao || '----'}/{v.ano_modelo || '----'}
                    </span>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {(v.km || 0).toLocaleString()} km
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-sm leading-tight line-clamp-2 uppercase tracking-tighter">
                    {v.montadora?.nome || ''} {v.modelo?.nome || 'Veículo'}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 uppercase tracking-wide">
                    {v.versao?.nome || 'Versão Base'}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Preço Venda
                    </p>
                    <p className="text-lg font-black text-emerald-600 tracking-tight">
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
          <div className="col-span-3 flex flex-col items-center justify-center py-20 opacity-40">
            <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sem veículos disponíveis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentStockMini;
