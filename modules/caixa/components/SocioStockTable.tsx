import React, { useMemo } from 'react';
import { ISocioStockStats } from '../caixa.types';

// SVGs for common icons
const FuelIcon = () => <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3V5.25m0 0V21m0-15.75H18a3 3 0 013 3v10.5a3 3 0 01-3 3h-2.25m0-16.5H6.75A3.375 3.375 0 003.375 6.75v12a3.375 3.375 0 003.375 3.375h9.75M15.75 3a3.375 3.375 0 00-3.375 3.375v15M9 15.75h3" /></svg>;
const GaugeIcon = () => <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h15.75c.621 0 1.125.504 1.125 1.125v6.75C21 20.496 20.496 21 19.875 21H4.125A1.125 1.125 0 013 19.875v-6.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12V9a3 3 0 013-3h0a3 3 0 013 3v3m-3-6h.008v.008H12V6z" /></svg>;
const SettingsIcon = () => <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 0115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.128l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m3.305 1.346l-.513 1.41m-14.095 5.128l-.513 1.41m11.43 3.554l.964 1.15m-9.642-11.49l.964 1.15M17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" /></svg>;
const ActivityIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const UsersIcon = () => <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-2.533-4.656 9.359 9.359 0 00-6.093 0A4.125 4.125 0 009 18.528v1.125c0 .033.004.066.011.098m5.887-1.212A3.75 3.75 0 1115 11.25M6.75 4.5a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5zM22.5 12a13.13 13.13 0 01-1.91 5.839m-4.03-12.906A13.13 13.13 0 0115 3.018m0 0c-.79 0-1.559.11-2.29.314m2.29-.314a13.144 13.144 0 00-2.122 6.045m6.146-6.045c.04.276.06.56.06.848a13.134 13.134 0 01-5.056 10.336" /></svg>;
const DollarSignIcon = () => <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface Props {
    socios: ISocioStockStats[];
}

interface VehicleRow {
    id: string;
    montadora: string;
    montadora_logo?: string;
    modelo: string;
    versao: string;
    placa: string;
    motorizacao: string;
    cambio: string;
    combustivel: string;
    ano_modelo: number;
    ano_fabricacao: number;
    totalCost: number;
    partners: {
        nome: string;
        valor: number;
        percent: number;
    }[];
}

const SocioStockTable: React.FC<Props> = ({ socios }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const { vehicleRows, partnerTotals } = useMemo(() => {
        const map = new Map<string, VehicleRow>();
        const totalsMap = new Map<string, number>();

        socios.forEach(socio => {
            let socioTotalValue = 0;
            (socio.veiculos || []).forEach(v => {
                if (!v || !v.id) return;

                socioTotalValue += (v.valor || 0);

                if (!map.has(v.id)) {
                    map.set(v.id, {
                        id: v.id,
                        montadora: v.montadora || 'N/A',
                        montadora_logo: v.montadora_logo,
                        modelo: v.modelo || 'N/A',
                        versao: v.versao || '',
                        placa: v.placa || 'N/A',
                        motorizacao: v.motorizacao || '',
                        cambio: v.cambio || '',
                        combustivel: v.combustivel || '',
                        ano_modelo: v.ano_modelo || 0,
                        ano_fabricacao: v.ano_fabricacao || 0,
                        totalCost: v.valor_total_custo || 0,
                        partners: []
                    });
                }
                map.get(v.id)!.partners.push({
                    nome: socio.nome ? socio.nome.split(' ')[0] : 'Sócio',
                    valor: v.valor || 0,
                    percent: v.valor_total_custo && v.valor_total_custo > 0
                        ? (v.valor / v.valor_total_custo) * 100
                        : 0
                });
            });
            totalsMap.set(socio.nome, socioTotalValue);
        });

        return {
            vehicleRows: Array.from(map.values()).sort((a, b) => a.modelo.localeCompare(b.modelo)),
            partnerTotals: Array.from(totalsMap.entries()).map(([nome, total]) => ({ nome, total }))
        };
    }, [socios]);

    return (
        <div className="bg-white/40 backdrop-blur-xl border border-slate-200/60 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 transition-all duration-500">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-white/60">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-300 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ActivityIcon />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Detalhamento do Estoque</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200"></span>
                            Exposição de Capital & Especificações Técnicas
                        </p>
                    </div>
                </div>
                <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patrimônio Ativo</span>
                    <span className="text-lg font-black text-slate-900 tracking-tighter">{vehicleRows.length} VEÍCULOS</span>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-6 bg-slate-50/30">
                {vehicleRows.map((row, idx) => (
                    <div
                        key={row.id}
                        className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100/40 hover:border-indigo-100 transition-all duration-500 overflow-hidden group"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                            {/* LADO ESQUERDO: VEÍCULO & FLAGS */}
                            <div className="md:col-span-5 p-8 border-r border-slate-50">
                                <div className="flex gap-6 items-center">
                                    {row.montadora_logo ? (
                                        <div className="w-16 h-16 flex-shrink-0 rounded-[1.5rem] bg-white border border-slate-100 p-3 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all duration-500 overflow-hidden">
                                            <img
                                                src={row.montadora_logo}
                                                alt={row.montadora}
                                                className="w-full h-full object-contain transition-all"
                                                onError={(e) => {
                                                    (e.target as any).style.display = 'none';
                                                    if ((e.target as any).parentElement) {
                                                        (e.target as any).parentElement.innerHTML = `<div class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">${row.montadora.substring(0, 3)}</div>`;
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 flex-shrink-0 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-xs font-black text-white uppercase shadow-lg group-hover:scale-105 transition-all">
                                            {row.montadora.substring(0, 3)}
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-1">{row.montadora}</span>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                            {row.modelo} <span className="text-slate-400 font-bold ml-1">{row.versao}</span>
                                        </h4>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <div className="px-2.5 py-1 bg-slate-900 text-[10px] font-black text-white rounded-lg tracking-widest uppercase shadow-md">
                                                {row.placa}
                                            </div>
                                            <div className="flex items-center gap-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-1.5" title="Combustível">
                                                    <FuelIcon />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{row.combustivel || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title="Motorização">
                                                    <GaugeIcon />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{row.motorizacao || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title="Câmbio">
                                                    <SettingsIcon />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{row.cambio || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5" title="Ano">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{row.ano_fabricacao}/{row.ano_modelo}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CENTRO: VALOR TOTAL */}
                            <div className="md:col-span-3 p-8 bg-slate-50/50 h-full flex flex-col justify-center items-center border-r border-slate-50 text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Equity de Custo</span>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                                    {fmt(row.totalCost)}
                                </p>
                                <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm group-hover:border-indigo-100 transition-colors">
                                    <UsersIcon />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{row.partners.length} INVESTIDORES</span>
                                </div>
                            </div>

                            {/* LADO DIREITO: DISTRIBUIÇÃO */}
                            <div className="md:col-span-4 p-8 flex flex-col justify-center gap-3">
                                {row.partners.map((p, pIdx) => (
                                    <div key={pIdx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100/50 rounded-2xl group-hover:bg-white group-hover:border-indigo-50 transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg ${pIdx === 0 ? 'bg-indigo-500' : pIdx === 1 ? 'bg-slate-900' : 'bg-rose-500'}`}>
                                                {p.nome.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{p.nome}</p>
                                                <p className="text-[10px] font-bold text-slate-400 tabular-nums">{fmt(p.valor)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-slate-900 tabular-nums leading-none block">{p.percent.toFixed(1)}%</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Participação</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER: TOTAL CONSOLIDADO */}
            <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50 border border-indigo-400/30">
                            <DollarSignIcon />
                        </div>
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-tighter leading-none">Visão Consolidada</h4>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-2">Capital Alocado por Sócio em Todo Estoque</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        {partnerTotals.map((pt, i) => (
                            <div key={i} className="flex flex-col items-center md:items-end p-5 bg-white/5 border border-white/10 rounded-[2rem] min-w-[160px] hover:bg-white/10 transition-colors backdrop-blur-md shadow-2xl">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">{pt.nome}</span>
                                <span className="text-xl font-black tracking-tighter tabular-nums">{fmt(pt.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocioStockTable;
