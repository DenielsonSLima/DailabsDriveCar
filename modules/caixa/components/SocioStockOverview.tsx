
import React from 'react';
import { ISocioStockStats } from '../caixa.types';

interface Props {
  socios: ISocioStockStats[];
}

const SocioStockOverview: React.FC<Props> = ({ socios }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Exposição por Sócio</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Alocação de capital e lucro no período</p>
        </div>
      </div>

      <div className="space-y-6">
        {socios.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest px-10">
              Nenhum dado societário vinculado.
            </p>
          </div>
        ) : socios.map((s, idx) => {
          const investmentByModel = s.investimento_por_modelo || [];
          const maxInvestment = Math.max(...investmentByModel.map(m => m.valor), 1);

          return (
            <div key={idx} className="bg-slate-50/50 rounded-[2rem] border border-slate-100/50 overflow-hidden transition-all hover:bg-white hover:border-indigo-200 hover:shadow-md group">
              {/* Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-sm uppercase transition-all group-hover:bg-indigo-600">
                    {s.nome.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 leading-none">{s.nome}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                      {s.quantidade_carros} {s.quantidade_carros === 1 ? 'veículo' : 'veículos'} • {s.porcentagem_estoque.toFixed(1)}% do pátio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Investido</p>
                    <p className="text-xs font-black text-slate-900">{fmt(s.valor_investido)}</p>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-6">
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Lucro</p>
                    <p className={`text-xs font-black ${s.lucro_periodo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {s.lucro_periodo > 0 ? '+' : ''}{fmt(s.lucro_periodo)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Portfolio Breakdown */}
              {investmentByModel.length > 0 && (
                <div className="px-5 pb-5 pt-2 bg-white/50 border-t border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Carteira por Modelo</p>
                  <div className="space-y-3">
                    {investmentByModel.sort((a, b) => b.valor - a.valor).slice(0, 4).map((m, mIdx) => (
                      <div key={mIdx} className="space-y-1 px-1">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
                          <span className="text-slate-600">{m.modelo}</span>
                          <span className="text-slate-400">{fmt(m.valor)}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                            style={{ width: `${(m.valor / maxInvestment) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocioStockOverview;
