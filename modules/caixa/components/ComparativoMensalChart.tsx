
import React, { useState } from 'react';
import { IComparativoMensal } from '../caixa.types';

interface Props {
    comparativo: IComparativoMensal;
    mesAtualLabel: string;
    mesAnteriorLabel: string;
}

const METRIC_CONFIG = [
    { key: 'vendas', label: 'Vendas', color: '#06b6d4', bgClass: 'bg-cyan-500' },
    { key: 'compras', label: 'Compras', color: '#6366f1', bgClass: 'bg-indigo-500' },
    { key: 'estoque', label: 'Estoque', color: '#3b82f6', bgClass: 'bg-blue-500' },
    { key: 'despesas_veiculo', label: 'Desp. Veículos', color: '#f59e0b', bgClass: 'bg-amber-500' },
    { key: 'despesas_variaveis', label: 'Desp. Variáveis', color: '#8b5cf6', bgClass: 'bg-violet-500' },
    { key: 'despesas_fixas', label: 'Desp. Fixas', color: '#f97316', bgClass: 'bg-orange-500' },
] as const;

type MetricKey = typeof METRIC_CONFIG[number]['key'];

const ComparativoMensalChart: React.FC<Props> = ({ comparativo, mesAtualLabel, mesAnteriorLabel }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtK = (v: number) => {
        if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
        return v.toFixed(0);
    };
    const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

    const { mes_atual, mes_anterior } = comparativo;

    // Collect all values for scaling
    const allBarValues = METRIC_CONFIG.map(m => Math.max(
        Number(mes_atual[m.key as MetricKey]) || 0,
        Number(mes_anterior[m.key as MetricKey]) || 0
    ));
    const maxBarValue = Math.max(...allBarValues, 1);

    // Chart dimensions
    const chartHeight = 260;
    const barAreaHeight = 220;

    // Y-axis steps
    const ySteps = 5;
    const stepValue = maxBarValue / ySteps;

    // Lucro values for the line overlay
    const lucroAtual = Number(mes_atual.lucro) || 0;
    const lucroAnterior = Number(mes_anterior.lucro) || 0;
    const maxLucro = Math.max(Math.abs(lucroAtual), Math.abs(lucroAnterior), 1);

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Comparativo Mensal</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                        {mesAnteriorLabel} vs {mesAtualLabel} • Despesas, Compras & Lucro
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {METRIC_CONFIG.map(m => (
                        <div key={m.key} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-sm ${m.bgClass}`}></div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-0.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lucro</span>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`rounded-2xl p-4 border ${lucroAnterior >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro {mesAnteriorLabel}</p>
                    <p className={`text-lg font-black ${lucroAnterior >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {lucroAnterior > 0 ? '+' : ''}{fmt(lucroAnterior)}
                    </p>
                </div>
                <div className={`rounded-2xl p-4 border ${lucroAtual >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro {mesAtualLabel}</p>
                    <p className={`text-lg font-black ${lucroAtual >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {lucroAtual > 0 ? '+' : ''}{fmt(lucroAtual)}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: chartHeight + 60 }}>
                {/* Y-Axis guide lines */}
                <div className="absolute inset-0" style={{ height: barAreaHeight }}>
                    {Array.from({ length: ySteps + 1 }).map((_, i) => {
                        const yPos = (i / ySteps) * barAreaHeight;
                        const val = maxBarValue - (i * stepValue);
                        return (
                            <div key={i} className="absolute left-0 right-0 flex items-center" style={{ top: yPos }}>
                                <span className="text-[8px] font-bold text-slate-300 w-14 text-right pr-3 shrink-0">
                                    {fmtK(val)}
                                </span>
                                <div className="flex-1 border-t border-dashed border-slate-100"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Bars - grouped by metric */}
                <div className="absolute left-14 right-0 flex" style={{ height: barAreaHeight }}>
                    {METRIC_CONFIG.map((metric, i) => {
                        const valAtual = Number(mes_atual[metric.key as MetricKey]) || 0;
                        const valAnterior = Number(mes_anterior[metric.key as MetricKey]) || 0;
                        const hAtual = (valAtual / maxBarValue) * barAreaHeight * 0.85;
                        const hAnterior = (valAnterior / maxBarValue) * barAreaHeight * 0.85;
                        const isHovered = hoveredMetric === metric.key;
                        const dimmed = hoveredMetric !== null && !isHovered;

                        return (
                            <div
                                key={metric.key}
                                className="relative flex-1 flex items-end justify-center gap-1.5 cursor-pointer group"
                                onMouseEnter={() => setHoveredMetric(metric.key)}
                                onMouseLeave={() => setHoveredMetric(null)}
                            >
                                {/* Tooltip */}
                                {isHovered && (
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{metric.label}</p>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] text-slate-300 font-bold">{mesAnteriorLabel}</span>
                                            <span className="text-[10px] font-black text-white">{fmt(valAnterior)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] text-slate-300 font-bold">{mesAtualLabel}</span>
                                            <span className="text-[10px] font-black text-white">{fmt(valAtual)}</span>
                                        </div>
                                        {valAnterior > 0 && (
                                            <div className="border-t border-white/10 mt-2 pt-1">
                                                <span className={`text-[9px] font-black ${valAtual >= valAnterior ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {valAtual >= valAnterior ? '▲' : '▼'} {Math.abs(((valAtual - valAnterior) / valAnterior) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                    </div>
                                )}

                                {/* Barra mês anterior (mais clara) */}
                                <div className="flex flex-col items-center justify-end" style={{ width: '35%', minWidth: 16 }}>
                                    <span className={`text-[8px] font-bold mb-1 transition-opacity duration-300 ${dimmed ? 'opacity-30' : 'opacity-100'}`} style={{ color: metric.color }}>
                                        {fmtK(valAnterior)}
                                    </span>
                                    <div
                                        className="rounded-t-lg transition-all duration-500 w-full"
                                        style={{
                                            height: Math.max(hAnterior, 2),
                                            backgroundColor: metric.color,
                                            opacity: dimmed ? 0.15 : 0.35,
                                            boxShadow: isHovered ? `0 4px 12px ${metric.color}30` : 'none',
                                        }}
                                    ></div>
                                </div>

                                {/* Barra mês atual (mais forte) */}
                                <div className="flex flex-col items-center justify-end" style={{ width: '35%', minWidth: 16 }}>
                                    <span className={`text-[8px] font-black mb-1 transition-opacity duration-300 ${dimmed ? 'opacity-30' : 'opacity-100'}`} style={{ color: metric.color }}>
                                        {fmtK(valAtual)}
                                    </span>
                                    <div
                                        className="rounded-t-lg transition-all duration-500 w-full"
                                        style={{
                                            height: Math.max(hAtual, 2),
                                            backgroundColor: metric.color,
                                            opacity: dimmed ? 0.3 : 1,
                                            boxShadow: isHovered ? `0 4px 16px ${metric.color}40` : 'none',
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Lucro line overlay (SVG) */}
                <svg
                    className="absolute left-14 right-0 top-0 pointer-events-none"
                    style={{ height: barAreaHeight }}
                    viewBox={`0 0 100 ${barAreaHeight}`}
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="lucroCompGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {(() => {
                        // Map lucro values to positions across all 5 metric groups
                        // Lucro anterior maps at position 1 (second metric) and lucro atual at position 3 (fourth metric)
                        const groupWidth = 100 / METRIC_CONFIG.length;
                        const x1 = groupWidth * 1 + groupWidth / 2; // position for anterior
                        const x2 = groupWidth * 3 + groupWidth / 2; // position for atual

                        const maxLucroScale = Math.max(maxBarValue, maxLucro);
                        const baseY = barAreaHeight * 0.85;
                        const y1 = barAreaHeight - ((lucroAnterior / maxLucroScale) * baseY);
                        const y2 = barAreaHeight - ((lucroAtual / maxLucroScale) * baseY);

                        const clampY = (y: number) => Math.max(15, Math.min(barAreaHeight - 5, y));

                        const cy1 = clampY(y1);
                        const cy2 = clampY(y2);

                        // Smooth curve
                        const cpx = (x1 + x2) / 2;
                        const linePath = `M ${x1} ${cy1} C ${cpx} ${cy1}, ${cpx} ${cy2}, ${x2} ${cy2}`;
                        const areaPath = `${linePath} L ${x2} ${barAreaHeight} L ${x1} ${barAreaHeight} Z`;

                        return (
                            <>
                                <path d={areaPath} fill="url(#lucroCompGradient)" />
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray="6,3"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Anterior point */}
                                <circle cx={x1} cy={cy1} r="5" fill="white" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                                <text x={x1} y={cy1 - 10} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="900" vectorEffect="non-scaling-stroke">
                                    {fmtK(lucroAnterior)}
                                </text>
                                {/* Atual point */}
                                <circle cx={x2} cy={cy2} r="5" fill="white" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                                <text x={x2} y={cy2 - 10} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="900" vectorEffect="non-scaling-stroke">
                                    {fmtK(lucroAtual)}
                                </text>
                            </>
                        );
                    })()}
                </svg>

                {/* Metric labels below bars */}
                <div className="absolute left-14 right-0 flex" style={{ top: barAreaHeight + 12 }}>
                    {METRIC_CONFIG.map((metric) => (
                        <div
                            key={metric.key}
                            className="flex-1 text-center cursor-pointer"
                            onMouseEnter={() => setHoveredMetric(metric.key)}
                            onMouseLeave={() => setHoveredMetric(null)}
                        >
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-wider leading-tight">{metric.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Month legend */}
            <div className="flex items-center justify-center gap-8 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-slate-300"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mesAnteriorLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-slate-700"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mesAtualLabel}</span>
                </div>
            </div>

            {/* Detail cards per month */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                {/* Mês Anterior */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{mesAnteriorLabel}</p>
                    <div className="space-y-2">
                        {METRIC_CONFIG.map(m => (
                            <div key={m.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }}></div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{m.label}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-700">{fmt(Number(mes_anterior[m.key as MetricKey]) || 0)}</span>
                            </div>
                        ))}
                        <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Lucro</span>
                            <span className={`text-[10px] font-black ${lucroAnterior >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {lucroAnterior > 0 ? '+' : ''}{fmt(lucroAnterior)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mês Atual */}
                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3">{mesAtualLabel}</p>
                    <div className="space-y-2">
                        {METRIC_CONFIG.map(m => (
                            <div key={m.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }}></div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{m.label}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-700">{fmt(Number(mes_atual[m.key as MetricKey]) || 0)}</span>
                            </div>
                        ))}
                        <div className="border-t border-indigo-100 pt-2 flex items-center justify-between">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Lucro</span>
                            <span className={`text-[10px] font-black ${lucroAtual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {lucroAtual > 0 ? '+' : ''}{fmt(lucroAtual)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparativoMensalChart;
