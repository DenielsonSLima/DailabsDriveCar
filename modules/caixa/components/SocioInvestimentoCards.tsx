
import React, { useState } from 'react';
import { ISocioStockStats } from '../caixa.types';

interface Props {
  socios: ISocioStockStats[];
}

const SocioInvestimentoCards: React.FC<Props> = ({ socios }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(v);
  const [expandedSocio, setExpandedSocio] = useState<string | null>(null);

  const totalInvestido = socios.reduce((acc, s) => acc + s.valor_investido, 0);
  const totalCarros = socios.reduce((acc, s) => acc + s.quantidade_carros, 0);
  const totalLucro = socios.reduce((acc, s) => acc + s.lucro_periodo, 0);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Investimento por Sócio</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Capital alocado em veículos • Lucro do mês</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-indigo-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-500 border border-indigo-100">
            {totalCarros} {totalCarros === 1 ? 'veículo' : 'veículos'}
          </span>
          <span className="px-3 py-1.5 bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
            {socios.length} {socios.length === 1 ? 'sócio' : 'sócios'}
          </span>
        </div>
      </div>

      {/* Totais rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Investido</p>
          <p className="text-lg font-black text-slate-900">{fmt(totalInvestido)}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Veículos</p>
          <p className="text-lg font-black text-slate-900">{totalCarros}</p>
        </div>
        <div className={`rounded-2xl p-4 border ${totalLucro >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${totalLucro >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Lucro Total Mês</p>
          <p className={`text-lg font-black ${totalLucro >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalLucro > 0 ? '+' : ''}{fmt(totalLucro)}
          </p>
        </div>
      </div>

      {/* Cards por sócio */}
      {socios.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum sócio com veículos no pátio</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {socios.map((s) => {
            const isExpanded = expandedSocio === s.socio_id;

            return (
              <div
                key={s.socio_id}
                className="group p-6 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all relative overflow-hidden"
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-5 -mr-10 -mt-10 group-hover:opacity-10 transition-opacity"></div>

                <div className="relative z-10">
                  {/* Cabeçalho do card */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg uppercase group-hover:scale-110 transition-transform">
                        {s.nome.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide">{s.nome}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {s.quantidade_carros} {s.quantidade_carros === 1 ? 'veículo' : 'veículos'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                        {s.porcentagem_estoque.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de porcentagem */}
                  {s.quantidade_carros > 0 && (
                    <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(s.porcentagem_estoque, 100)}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Métricas */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor Investido</p>
                      <p className="text-sm font-black text-slate-900">{fmt(s.valor_investido)}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${s.lucro_periodo >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                      <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${s.lucro_periodo >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Lucro do Mês
                      </p>
                      <p className={`text-sm font-black ${s.lucro_periodo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {s.lucro_periodo > 0 ? '+' : ''}{fmt(s.lucro_periodo)}
                      </p>
                    </div>
                  </div>

                  {/* Veículos - Expandível */}
                  {s.veiculos.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpandedSocio(isExpanded ? null : s.socio_id)}
                        className="w-full flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors py-2"
                      >
                        <span>Veículos ({s.veiculos.length})</span>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="space-y-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                          {s.veiculos.map((v, vIdx) => (
                            <div key={vIdx} className="flex items-center justify-between text-[10px] bg-white px-3 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                              <div className="flex items-center space-x-2">
                                {v.imagem ? (
                                  <img src={v.imagem} alt={v.modelo} className="w-8 h-8 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold uppercase text-slate-700 block leading-tight">{v.modelo}</span>
                                  <span className="text-slate-400 text-[9px] uppercase tracking-wider">{v.placa}</span>
                                </div>
                              </div>
                              <span className="font-black text-slate-800">{fmt(v.valor)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SocioInvestimentoCards;
