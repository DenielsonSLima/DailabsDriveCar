
import React, { useState } from 'react';
import { ISocioStockStats } from '../caixa.types';

interface Props {
    socios: ISocioStockStats[];
}

const SocioPatrimonioCards: React.FC<Props> = ({ socios }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(v);
    const [expandedSocio, setExpandedSocio] = useState<string | null>(null);

    const totalEmEstoque = socios[0]?.total_investido_todos_socios || 0;
    const totalEmPatrimonio = socios[0]?.total_patrimonio_liquido_todos ? socios[0].total_patrimonio_liquido_todos - totalEmEstoque : 0;
    const totalPatrimonioLiquido = socios[0]?.total_patrimonio_liquido_todos || 0;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Patrimônio Consolidado por Sócio</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Soma de veículos em estoque + ativos cadastrados</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-white border border-slate-800">
                        Total Geral: {fmt(totalPatrimonioLiquido)}
                    </span>
                </div>
            </div>

            {/* Totais rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/50">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total no Estoque</p>
                    <p className="text-lg font-black text-indigo-900">{fmt(totalEmEstoque)}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100/50">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total em Outros Ativos</p>
                    <p className="text-lg font-black text-emerald-900">{fmt(totalEmPatrimonio)}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Participação Média</p>
                    <p className="text-lg font-black text-slate-900">{socios.length > 0 ? (100 / socios.length).toFixed(0) : 0}% <span className="text-[10px] font-bold text-slate-400">por sócio</span></p>
                </div>
            </div>

            {/* Lista por sócio */}
            {socios.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum dado patrimonial detectado</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {socios.map((s) => {
                        const isExpanded = expandedSocio === s.socio_id;
                        const patrimonioTotalSocio = (s.valor_investido || 0) + (s.valor_patrimonio_pessoal || 0);

                        return (
                            <div
                                key={s.socio_id}
                                className={`group rounded-3xl border transition-all overflow-hidden ${isExpanded ? 'bg-white border-indigo-200 shadow-xl' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}
                            >
                                <div
                                    className="p-4 md:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    onClick={() => setExpandedSocio(isExpanded ? null : s.socio_id)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase transition-all shadow-sm ${isExpanded ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-900 text-white'}`}>
                                            {s.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide">{s.nome}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Participação:</span>
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                                    {s.porcentagem_participacao?.toFixed(2) || "0.00"}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-8">
                                        <div className="hidden sm:block">
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Veículos</p>
                                                    <p className="text-xs font-bold text-slate-700">{fmt(s.valor_investido || 0)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Outros Ativos</p>
                                                    <p className="text-xs font-bold text-slate-700">{fmt(s.valor_patrimonio_pessoal || 0)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right pl-6 border-l border-slate-200">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Patrimônio Total</p>
                                            <p className="text-base font-black text-slate-900 leading-tight">{fmt(patrimonioTotalSocio)}</p>
                                        </div>

                                        <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/50 text-slate-400'}`}>
                                            <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                            {/* Veículos */}
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest px-1">Detalhamento de Veículos ({s.quantidade_carros || 0})</p>
                                                {(s.veiculos || []).length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {s.veiculos.map((v, vIdx) => (
                                                            <div key={`v-${vIdx}`} className="flex items-center justify-between text-[10px] bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                                                                <span className="font-bold text-slate-700 truncate mr-2">
                                                                    {v.montadora} {v.modelo} {v.versao}
                                                                </span>
                                                                <span className="font-black text-slate-800 shrink-0">{fmt(v.valor)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-slate-400 italic px-1">Nenhum veículo vinculado.</p>
                                                )}
                                            </div>

                                            {/* Ativos Extras */}
                                            <div className="space-y-2">
                                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest px-1">Outros Ativos / Aportes ({(s.patrimonio_pessoal || []).length})</p>
                                                {(s.patrimonio_pessoal || []).length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {s.patrimonio_pessoal.map((p, pIdx) => (
                                                            <div key={`p-${pIdx}`} className="flex items-center justify-between text-[10px] bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                                                                <span className="font-bold text-slate-700 truncate mr-2">{p.descricao}</span>
                                                                <span className="font-black text-slate-800 shrink-0">{fmt(p.valor)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-slate-400 italic px-1">Nenhum outro ativo cadastrado.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SocioPatrimonioCards;
