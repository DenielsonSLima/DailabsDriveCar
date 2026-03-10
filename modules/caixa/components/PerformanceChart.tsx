
import React from 'react';

interface IPerformanceMonth {
    label: string;
    faturado: number;
    custo: number;
    despesas: number;
    despesas_fixas: number;
    despesas_variaveis: number;
    lucro: number;
}

interface Props {
    history: IPerformanceMonth[];
}

const PerformanceChart: React.FC<Props> = ({ history }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
    const fmtK = (v: number) => {
        if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
        return v.toFixed(0);
    };

    // Calculate chart scaling
    const maxVal = Math.max(...history.flatMap(m => [m.faturado, m.custo, m.despesas]), 1000);
    const chartHeight = 200;
    const ySteps = 4;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm h-full flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Desempenho Trimestral</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Histórico de faturamento, custos e lucro</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Faturado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Custo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-rose-500"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Despesas</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                        <div className="w-4 h-0.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Lucro</span>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 flex flex-col min-h-[220px]">
                <div className="relative flex-1">
                    {/* Y-Axis Grid */}
                    <div className="relative h-64 border-l border-b border-slate-100 mb-6">
                        {/* Y-Axis Labels (now absolutely positioned outside the area) */}
                        <div className="absolute top-0 bottom-0 -left-12 w-10 flex flex-col justify-between text-[8px] font-bold text-slate-300 pointer-events-none text-right">
                            <span>{fmtK(maxVal)}</span>
                            <span>{fmtK(maxVal * 0.75)}</span>
                            <span>{fmtK(maxVal * 0.5)}</span>
                            <span>{fmtK(maxVal * 0.25)}</span>
                            <span>0</span>
                        </div>

                        {/* Content Area (Bars + Line) */}
                        <div className="absolute inset-0">
                            {/* THE KEY: Use a single container for bars and lines reaching 100% width */}
                            <div className="relative w-full h-full">

                                {/* Profit Line Layer (SVG for path, HTML for dots to avoid distortion) */}
                                <div className="absolute inset-0 pointer-events-none z-20">
                                    <svg className="absolute inset-x-0 top-0 bottom-[30px] w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <defs>
                                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>
                                        {(() => {
                                            const profitMax = Math.max(...history.map(m => m.lucro), 50000);
                                            const getX = (i: number) => (i + 0.5) * (100 / history.length);
                                            const getY = (v: number) => 100 - (v / profitMax) * 60 - 20;

                                            const points = history.map((m, i) => ({ x: getX(i), y: getY(m.lucro) }));

                                            let pathData = `M ${points[0].x},${points[0].y}`;
                                            for (let i = 0; i < points.length - 1; i++) {
                                                const curr = points[i];
                                                const next = points[i + 1];
                                                const cp1x = curr.x + (next.x - curr.x) / 3;
                                                const cp2x = curr.x + (next.x - curr.x) * 2 / 3;
                                                pathData += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
                                            }

                                            return (
                                                <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" className="opacity-80" />
                                            );
                                        })()}
                                    </svg>

                                    {/* HTML Points (Never distorted) */}
                                    {history.map((m, i) => {
                                        const profitMax = Math.max(...history.map(m => m.lucro), 50000);
                                        const x = (i + 0.5) * (100 / history.length);
                                        const y = 100 - (m.lucro / profitMax) * 60 - 20;

                                        return (
                                            <div
                                                key={i}
                                                className="absolute flex flex-col items-center justify-center"
                                                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                                            >
                                                <div className="w-3 h-3 bg-[#064e3b] rounded-full flex items-center justify-center shadow-lg ring-2 ring-emerald-500/20">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                </div>
                                                <span
                                                    className="absolute -top-6 text-[10px] font-black text-emerald-500 whitespace-nowrap drop-shadow-sm"
                                                    style={{ fontSize: '10px' }}
                                                >
                                                    {m.lucro > 0 ? `${(m.lucro / 1000).toFixed(0)}k` : '0'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bars Container */}
                                <div className="absolute inset-0 flex">
                                    {history.map((m, i) => {
                                        const hF = (m.faturado / maxVal) * 100;
                                        const hC = (m.custo / maxVal) * 100;
                                        const hD = (m.despesas / maxVal) * 100;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center justify-end group px-4 relative">
                                                <div className="flex items-end gap-1.5 w-full max-w-[80px] h-full pb-6">
                                                    {/* FATURADO */}
                                                    <div className="flex-1 bg-blue-600/80 group-hover:bg-blue-600 rounded-t-sm transition-all duration-300 relative shadow-sm" style={{ height: `${hF}%` }}>
                                                        <div className="absolute inset-x-0 top-0 h-[3px] bg-blue-400 rounded-t-sm shadow-[0_0_12px_rgba(96,165,250,0.6)]"></div>
                                                    </div>
                                                    {/* CUSTO */}
                                                    <div className="flex-1 bg-slate-500/80 group-hover:bg-slate-500 rounded-t-sm transition-all duration-300 relative shadow-sm" style={{ height: `${hC}%` }}>
                                                        <div className="absolute inset-x-0 top-0 h-[3px] bg-slate-300 rounded-t-sm shadow-[0_0_12px_rgba(203,213,225,0.6)]"></div>
                                                    </div>
                                                    {/* DESPESAS */}
                                                    <div className="flex-1 bg-rose-500/80 group-hover:bg-rose-500 rounded-t-sm transition-all duration-300 relative shadow-sm" style={{ height: `${hD}%` }}>
                                                        <div className="absolute inset-x-0 top-0 h-[3px] bg-rose-300 rounded-t-sm shadow-[0_0_12px_rgba(252,165,165,0.6)]"></div>
                                                    </div>
                                                </div>

                                                {/* Tooltip - Adjusted for better overlap and visibility */}
                                                <div className="absolute -top-24 opacity-0 group-hover:opacity-100 group-hover:-top-32 transition-all duration-300 bg-slate-900/98 backdrop-blur-xl text-white p-4 rounded-2xl text-[9.5px] font-bold z-[100] pointer-events-none whitespace-nowrap shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 ring-1 ring-black scale-90 group-hover:scale-100">
                                                    <div className="flex justify-between gap-8 mb-2">
                                                        <span className="text-slate-400 uppercase tracking-wider">Faturado:</span>
                                                        <span className="text-blue-400 tabular-nums">{fmt(m.faturado)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-8 mb-2">
                                                        <span className="text-slate-400 uppercase tracking-wider">Custo:</span>
                                                        <span className="text-slate-300 tabular-nums">{fmt(m.custo)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-8 mb-2">
                                                        <span className="text-slate-400 uppercase tracking-wider">Fixas:</span>
                                                        <span className="text-rose-400 tabular-nums">{fmt(m.despesas_fixas)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-8 mb-2">
                                                        <span className="text-slate-400 uppercase tracking-wider">Variáveis:</span>
                                                        <span className="text-rose-400 tabular-nums">{fmt(m.despesas_variaveis)}</span>
                                                    </div>
                                                    <div className="pt-2 mt-1 border-t border-white/10 flex justify-between gap-8">
                                                        <span className="text-slate-400 uppercase font-black tracking-widest">Lucro:</span>
                                                        <span className="text-emerald-400 font-black tabular-nums">{fmt(m.lucro)}</span>
                                                    </div>
                                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-b border-r border-white/10"></div>
                                                </div>

                                                {/* Label below the bar */}
                                                <div className="absolute -bottom-10 left-0 right-0 text-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-blue-600 group-hover:scale-110 transition-all cursor-default">
                                                        {m.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User values confirmation */}
                <div className="absolute bottom-4 right-8 text-[8px] font-bold text-slate-300 uppercase tracking-widest text-right">
                    Valores verificados conforme espelho comercial
                </div>
            </div>
        </div>
    );
};

export default PerformanceChart;
