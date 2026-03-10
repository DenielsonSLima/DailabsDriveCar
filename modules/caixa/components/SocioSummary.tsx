import React from 'react';
import { ISocioStockStats } from '../caixa.types';

interface Props {
    socios: ISocioStockStats[];
}

const SocioSummary: React.FC<Props> = ({ socios }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socios.map((socio, idx) => {
                // Cálculo de métricas baseado na regra de 33.3% para sócios Klecio, Newton e Yuri
                // O valor_investido vindo do RPC já é o valor individual
                const margin = socio.valor_investido > 0
                    ? ((socio.lucro_periodo / socio.valor_investido) * 100).toFixed(1)
                    : '0.0';

                return (
                    <div
                        key={socio.socio_id || idx}
                        className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:bg-white transition-all duration-300 group"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{socio.nome.split(' ')[0]}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sócio Hidrocar</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 italic">
                                {socio.porcentagem_participacao?.toFixed(1) || '33.3'}% Cotas
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Investimento */}
                            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Exposição de Capital</p>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tighter">{fmt(socio.valor_investido)}</h4>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Veículos */}
                                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ativos Envolv.</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-slate-900 leading-none">{socio.quantidade_carros}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Veículos</span>
                                    </div>
                                </div>

                                {/* Margem */}
                                <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem Ref.</p>
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <span className="text-lg font-black leading-none">{margin}%</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Retorno e Lucro */}
                            <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                                <div className="flex justify-between items-center bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100/50">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lucro a Receber</span>
                                    <span className="text-sm font-black text-indigo-500 tracking-tighter">{fmt(socio.lucro_pendente)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro Gerado</p>
                                        <p className="text-sm font-black text-slate-900 tracking-tighter opacity-80">{fmt(socio.lucro_periodo)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Dinheiro em Caixa</p>
                                        <p className="text-lg font-black text-emerald-600 tracking-tighter">{fmt(socio.lucro_caixa)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SocioSummary;
