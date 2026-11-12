
import React, { useState } from 'react';
import { IForecastMes } from '../caixa.types';

interface Props {
  forecast: IForecastMes[];
}

const ForecastChart: React.FC<Props> = ({ forecast }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtK = (v: number) => {
    if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return v.toFixed(0);
  };
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (forecast.length === 0) return null;

  // Calcular valor máximo para escala
  const allValues = forecast.flatMap(f => [f.contas_pagar, f.contas_receber, Math.abs(f.lucro_projetado)]);
  const maxValue = Math.max(...allValues, 1);

  // Dimensões do gráfico
  const chartWidth = 100; // percentual
  const chartHeight = 280;
  const barAreaHeight = 220;
  const barGroupWidth = 100 / forecast.length;
  const barWidth = 28; // % do grupo

  // Calcular pontos da linha de lucro
  const lucroPoints = forecast.map((f, i) => {
    const x = (i * barGroupWidth) + (barGroupWidth / 2);
    const normalizedY = barAreaHeight - ((f.lucro_projetado / maxValue) * (barAreaHeight * 0.85));
    const clampedY = Math.max(20, Math.min(barAreaHeight - 10, normalizedY));
    return { x, y: clampedY };
  });

  // Gerar path SVG suave para a linha de lucro
  const generateLinePath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
      d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  // Escalas Y para as guias
  const ySteps = 5;
  const stepValue = maxValue / ySteps;

  // Totais
  const totalPagar = forecast.reduce((a, f) => a + f.contas_pagar, 0);
  const totalReceber = forecast.reduce((a, f) => a + f.contas_receber, 0);
  const totalLucro = forecast.reduce((a, f) => a + f.lucro_projetado, 0);

  return (
    <div className="dc-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 normal-case tracking-normal">Previsão Financeira</h3>
          <p className="text-xs text-slate-400 font-semibold normal-case mt-1 tracking-normal">Contas a pagar & receber • Próximos 4 meses</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">A Receber</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
            <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">A Pagar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Lucro Projetado</span>
          </div>
        </div>
      </div>

      {/* Resumo dos totais */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-500 normal-case tracking-normal mb-1">Total a Receber</p>
          <p className="text-lg font-semibold text-emerald-700">{fmt(totalReceber)}</p>
        </div>
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
          <p className="text-xs font-semibold text-rose-500 normal-case tracking-normal mb-1">Total a Pagar</p>
          <p className="text-lg font-semibold text-rose-700">{fmt(totalPagar)}</p>
        </div>
        <div className={`rounded-2xl p-4 border ${totalLucro >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className={`text-xs font-semibold normal-case tracking-normal mb-1 ${totalLucro >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>Resultado Projetado</p>
          <p className={`text-lg font-semibold ${totalLucro >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
            {totalLucro > 0 ? '+' : ''}{fmt(totalLucro)}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="relative" style={{ height: chartHeight + 60 }}>
        {/* Linhas guia horizontais */}
        <div className="absolute inset-0" style={{ height: barAreaHeight }}>
          {Array.from({ length: ySteps + 1 }).map((_, i) => {
            const yPos = (i / ySteps) * barAreaHeight;
            const val = maxValue - (i * stepValue);
            return (
              <div key={i} className="absolute left-0 right-0 flex items-center" style={{ top: yPos }}>
                <span className="text-xs font-semibold text-slate-300 w-14 text-right pr-3 shrink-0">
                  {fmtK(val)}
                </span>
                <div className="flex-1 border-t border-dashed border-slate-100"></div>
              </div>
            );
          })}
        </div>

        {/* Barras */}
        <div className="absolute left-14 right-0 flex" style={{ height: barAreaHeight }}>
          {forecast.map((f, i) => {
            const receberH = (f.contas_receber / maxValue) * barAreaHeight * 0.85;
            const pagarH = (f.contas_pagar / maxValue) * barAreaHeight * 0.85;
            const isHovered = hoveredIdx === i;

            return (
              <div
                key={i}
                className="relative flex-1 flex items-end justify-center gap-2 cursor-pointer group"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-sm min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs font-semibold normal-case tracking-normal text-slate-400 mb-2">{f.mes}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-emerald-400 font-semibold">A Receber</span>
                      <span className="text-xs font-semibold text-emerald-400">{fmt(f.contas_receber)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-rose-400 font-semibold">A Pagar</span>
                      <span className="text-xs font-semibold text-rose-400">{fmt(f.contas_pagar)}</span>
                    </div>
                    <div className="border-t border-white/10 mt-1 pt-1 flex items-center justify-between">
                      <span className="text-xs text-indigo-400 font-semibold">Lucro</span>
                      <span className={`text-xs font-semibold ${f.lucro_projetado >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {f.lucro_projetado > 0 ? '+' : ''}{fmt(f.lucro_projetado)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                )}

                {/* Barra Receber (verde) */}
                <div
                  className={`rounded-t-xl transition-all duration-500 ${isHovered ? 'bg-emerald-400 shadow-sm shadow-emerald-500/20' : 'bg-emerald-500'}`}
                  style={{
                    height: Math.max(receberH, 2),
                    width: `${barWidth}%`,
                    minWidth: 24,
                    opacity: hoveredIdx !== null && !isHovered ? 0.4 : 1
                  }}
                ></div>

                {/* Barra Pagar (vermelha) */}
                <div
                  className={`rounded-t-xl transition-all duration-500 ${isHovered ? 'bg-rose-400 shadow-sm shadow-rose-500/20' : 'bg-rose-500'}`}
                  style={{
                    height: Math.max(pagarH, 2),
                    width: `${barWidth}%`,
                    minWidth: 24,
                    opacity: hoveredIdx !== null && !isHovered ? 0.4 : 1
                  }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Linha do Lucro (SVG overlay) */}
        <svg
          className="absolute left-14 right-0 top-0 pointer-events-none"
          style={{ height: barAreaHeight }}
          viewBox={`0 0 ${chartWidth} ${barAreaHeight}`}
          preserveAspectRatio="none"
        >
          {/* Gradient fill sob a linha */}
          <defs>
            <linearGradient id="lucroGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Área preenchida */}
          {lucroPoints.length >= 2 && (
            <path
              d={`${generateLinePath(lucroPoints)} L ${lucroPoints[lucroPoints.length - 1].x} ${barAreaHeight} L ${lucroPoints[0].x} ${barAreaHeight} Z`}
              fill="url(#lucroGradient)"
            />
          )}

          {/* Linha */}
          <path
            d={generateLinePath(lucroPoints)}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Pontos */}
          {lucroPoints.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#6366f1" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              {hoveredIdx === i && (
                <circle cx={p.x} cy={p.y} r="8" fill="#6366f1" fillOpacity="0.2" stroke="none" />
              )}
            </g>
          ))}
        </svg>

        {/* Labels dos meses */}
        <div className="absolute left-14 right-0 flex" style={{ top: barAreaHeight + 12 }}>
          {forecast.map((f, i) => (
            <div key={i} className="flex-1 text-center">
              <p className="text-xs font-semibold text-slate-600 normal-case tracking-normal">{f.mes.split('/')[0]}</p>
              <p className="text-xs font-semibold text-slate-300">{f.mes.split('/')[1]}</p>
            </div>
          ))}
        </div>

        {/* Valores por mês abaixo */}
        <div className="absolute left-14 right-0 flex" style={{ top: barAreaHeight + 40 }}>
          {forecast.map((f, i) => (
            <div key={i} className="flex-1 text-center">
              <p className={`text-xs font-semibold ${f.lucro_projetado >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>
                {f.lucro_projetado > 0 ? '+' : ''}{fmt(f.lucro_projetado)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detalhamento por mês - cards compactos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
        {forecast.map((f, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border transition-all cursor-default ${
              hoveredIdx === i
                ? 'bg-indigo-50 border-indigo-200 shadow-md'
                : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
            }`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-3">{f.mes}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-semibold text-slate-400 normal-case">Receber</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{fmt(f.contas_receber)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <span className="text-xs font-semibold text-slate-400 normal-case">Pagar</span>
                </div>
                <span className="text-xs font-semibold text-rose-600">{fmt(f.contas_pagar)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 normal-case">Resultado</span>
                <span className={`text-xs font-semibold ${f.lucro_projetado >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                  {f.lucro_projetado > 0 ? '+' : ''}{fmt(f.lucro_projetado)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastChart;
