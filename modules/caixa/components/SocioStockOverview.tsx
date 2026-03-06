
import React from 'react';
import { ISocioStockStats } from '../caixa.types';

interface Props {
  socios: ISocioStockStats[];
}

const SocioStockOverview: React.FC<Props> = ({ socios }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(v);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-10 -mr-20 -mt-20"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em]">Exposição & Retorno por Sócio</h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Capital no pátio vs. Lucro realizado no mês</p>
          </div>
          <span className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5">Consolidado</span>
        </div>

        <div className="space-y-12">
          {socios.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest px-10">
                Nenhum vínculo societário detectado no estoque ativo ou em vendas do período.
              </p>
            </div>
          ) : socios.map((s, idx) => (
            <div key={idx} className="group animate-in fade-in duration-500 bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg uppercase transition-transform group-hover:scale-110">
                    {s.nome.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-100">{s.nome}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {s.quantidade_carros > 0
                        ? `${s.quantidade_carros} ${s.quantidade_carros === 1 ? 'veículo' : 'veículos'} • ${s.porcentagem_estoque.toFixed(2)}% do Pátio`
                        : 'Sem veículos no pátio'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  {s.valor_investido > 0 && (
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Investido</p>
                      <p className="text-sm font-black text-white">{fmt(s.valor_investido)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Lucro</p>
                    <p className={`text-sm font-black ${s.lucro_periodo >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {s.lucro_periodo > 0 ? '+' : ''}{fmt(s.lucro_periodo)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de Progresso - só mostra se tiver veículos no pátio */}
              {s.quantidade_carros > 0 && (
                <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${s.porcentagem_estoque}%` }}
                  ></div>
                </div>
              )}

              {/* Lista de Veículos - somente se houver veículos vinculados no pátio */}
              {s.veiculos.length > 0 && (
                <div className="space-y-2 mt-4 border-t border-white/5 pt-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Veículos Vinculados</p>
                  <div className="grid grid-cols-1 gap-2">
                    {s.veiculos.map((v, vIdx) => (
                      <div key={vIdx} className="flex items-center justify-between text-[10px] text-slate-300 bg-black/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                          <span className="font-bold uppercase">{v.modelo}</span>
                          <span className="text-slate-500 text-[9px] bg-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider">{v.placa}</span>
                        </div>
                        <span className="font-bold">{fmt(v.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocioStockOverview;
