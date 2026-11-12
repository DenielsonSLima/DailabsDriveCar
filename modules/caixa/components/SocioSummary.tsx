import React from 'react';
import { ISocioStockStats } from '../caixa.types';

interface Props {
    socios: ISocioStockStats[];
}

const SocioSummary: React.FC<Props> = ({ socios }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return (
        <div className="dc-partners">
            {socios.map((socio, idx) => {
                // Cálculo de métricas baseado na regra de 33.3% para sócios Klecio, Newton e Yuri
                // O valor_investido vindo do RPC já é o valor individual
                const margin = socio.valor_investido > 0
                    ? ((socio.lucro_periodo / socio.valor_investido) * 100).toFixed(1)
                    : '0.0';

                return (
                    <div
                        key={socio.socio_id || idx}
                        className="dc-panel hover:shadow-sm hover:bg-white transition-all duration-300 group"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shadow-sm transition-transform">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 normal-case tracking-normal leading-none">{socio.nome.split(' ')[0]}</h3>
                                    <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mt-1">Sócio</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold normal-case tracking-normal border border-emerald-100 italic">
                                {socio.porcentagem_participacao?.toFixed(1) || '33.3'}% Cotas
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Investimento */}
                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Exposição de Capital</p>
                                        <h4 className="dc-kpi-value">{fmt(socio.valor_investido)}</h4>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Veículos */}
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Ativos Envolv.</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold text-slate-900 leading-none">{socio.quantidade_carros}</span>
                                        <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Veículos</span>
                                    </div>
                                </div>

                                {/* Margem */}
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Margem Ref.</p>
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <span className="text-lg font-semibold leading-none">{margin}%</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Retorno e Lucro */}
                            <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                                <div className="flex justify-between items-center bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100/50">
                                    <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Lucro a Receber</span>
                                    <span className="dc-kpi-value">{fmt(socio.lucro_pendente)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Lucro Gerado</p>
                                        <p className="dc-kpi-value">{fmt(socio.lucro_periodo)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-emerald-600 normal-case tracking-normal mb-1">Dinheiro em Caixa</p>
                                        <p className="dc-kpi-value">{fmt(socio.lucro_caixa)}</p>
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
