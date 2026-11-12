
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
    <div className="dc-panel h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 normal-case tracking-normal">Exposição por Sócio</h3>
          <p className="text-xs text-slate-400 font-semibold normal-case mt-1 tracking-normal">Alocação de capital e lucro no período</p>
        </div>
      </div>

      <div className="space-y-6">
        {socios.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <p className="text-slate-400 font-semibold normal-case text-xs tracking-normal px-10">
              Nenhum dado societário vinculado.
            </p>
          </div>
        ) : socios.map((s, idx) => {
          const investmentByModel = s.investimento_por_modelo || [];
          const maxInvestment = Math.max(...investmentByModel.map(m => m.valor), 1);

          return (
            <div key={idx} className="bg-slate-50/50 rounded-2xl border border-slate-100/50 overflow-hidden transition-all hover:bg-white hover:border-indigo-200 hover:shadow-md group">
              {/* Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold text-base shadow-sm normal-case transition-all group-hover:bg-indigo-600">
                    {s.nome.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold normal-case text-slate-800 leading-none">{s.nome}</h4>
                    <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mt-1">
                      {s.quantidade_carros} {s.quantidade_carros === 1 ? 'veículo' : 'veículos'} • {s.porcentagem_estoque.toFixed(1)}% do pátio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-0.5">Investido</p>
                    <p className="dc-kpi-value">{fmt(s.valor_investido)}</p>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-6">
                    <p className="text-xs font-semibold text-emerald-500 normal-case tracking-normal mb-0.5">Lucro</p>
                    <p className={`text-xs font-semibold ${s.lucro_periodo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {s.lucro_periodo > 0 ? '+' : ''}{fmt(s.lucro_periodo)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Portfolio Breakdown */}
              {investmentByModel.length > 0 && (
                <div className="px-5 pb-5 pt-2 bg-white/50 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-3 px-1">Carteira por Modelo</p>
                  <div className="space-y-3">
                    {investmentByModel.sort((a, b) => b.valor - a.valor).slice(0, 4).map((m, mIdx) => (
                      <div key={mIdx} className="space-y-1 px-1">
                        <div className="flex justify-between items-center text-xs font-semibold normal-case tracking-normal">
                          <span className="text-slate-600">{m.modelo}</span>
                          <span className="dc-kpi-value">{fmt(m.valor)}</span>
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
