import React from 'react';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// ===================== KPI CARD =====================
export const KpiCard = ({ label, valor, sub, color = 'slate', isCurrency = true, icon }: {
    label: string; valor: number; sub?: string; color?: string; isCurrency?: boolean; icon: string;
}) => (
    <div className="dc-kpi-card">
        <div className="flex items-start justify-between mb-2">
            <p className="dc-kpi-label">{label}</p>
            <div className={`w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center`}>
                <svg className={`w-4 h-4 text-slate-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
            </div>
        </div>
        <h3 className="dc-kpi-value">
            {isCurrency ? formatCurrency(valor) : valor}
        </h3>
        {sub && <p className="dc-kpi-hint">{sub}</p>}
    </div>
);

// ===================== SEÇÃO HEADER =====================
export const SecaoHeader = ({ id, titulo, subtitulo, count, valor, icon, color, isOpen, onToggle }: {
    id: string; titulo: string; subtitulo: string; count: number; valor?: number; icon: string; color: string; isOpen: boolean; onToggle: () => void;
}) => (
    <button
        onClick={onToggle}
        className={`w-full flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border transition-all ${isOpen
                ? 'bg-indigo-50 text-indigo-950 border-indigo-200 shadow-sm'
                : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOpen ? 'bg-white border border-indigo-100' : 'bg-slate-100 border border-slate-200'
                }`}>
                <svg className={`w-5 h-5 ${isOpen ? 'text-indigo-700' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
            </div>
            <div className="text-left">
                <h4 className="text-sm font-semibold normal-case tracking-tight">{titulo}</h4>
                <p className={`text-xs font-bold normal-case tracking-normal mt-0.5 ${isOpen ? 'text-slate-500' : 'text-slate-400'}`}>{subtitulo}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right">
                <span className={`text-xs font-semibold normal-case tracking-normal ${isOpen ? 'text-slate-500' : 'text-slate-400'}`}>
                    {count} {count === 1 ? 'registro' : 'registros'}
                </span>
                {valor !== undefined && (
                    <p className={`text-sm font-semibold ${isOpen ? 'text-indigo-700' : 'text-slate-900'}`}>{formatCurrency(valor)}</p>
                )}
            </div>
            <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </button>
);
