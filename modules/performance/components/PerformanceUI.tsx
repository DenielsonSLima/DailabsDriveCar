import React from 'react';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// ===================== KPI CARD =====================
export const KpiCard = ({ label, valor, sub, color = 'slate', isCurrency = true, icon }: {
    label: string; valor: number; sub?: string; color?: string; isCurrency?: boolean; icon: string;
}) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
            <div className={`w-8 h-8 rounded-xl bg-${color}-50 border border-${color}-100 flex items-center justify-center`}>
                <svg className={`w-4 h-4 text-${color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
            </div>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {isCurrency ? formatCurrency(valor) : valor}
        </h3>
        {sub && <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{sub}</p>}
    </div>
);

// ===================== SEÇÃO HEADER =====================
export const SecaoHeader = ({ id, titulo, subtitulo, count, valor, icon, color, isOpen, onToggle }: {
    id: string; titulo: string; subtitulo: string; count: number; valor?: number; icon: string; color: string; isOpen: boolean; onToggle: () => void;
}) => (
    <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${isOpen
                ? 'bg-slate-900 text-white border-slate-800 shadow-xl'
                : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
            }`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOpen ? 'bg-white/10' : `bg-${color}-50 border border-${color}-100`
                }`}>
                <svg className={`w-5 h-5 ${isOpen ? 'text-white' : `text-${color}-500`}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
            </div>
            <div className="text-left">
                <h4 className="text-sm font-black uppercase tracking-tight">{titulo}</h4>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isOpen ? 'text-white/50' : 'text-slate-400'}`}>{subtitulo}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isOpen ? 'text-white/50' : 'text-slate-400'}`}>
                    {count} {count === 1 ? 'registro' : 'registros'}
                </span>
                {valor !== undefined && (
                    <p className={`text-sm font-black ${isOpen ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(valor)}</p>
                )}
            </div>
            <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180 text-white/60' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </button>
);
