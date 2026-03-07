import React from 'react';
import { ICaixaDashboardData, IForecastMes } from '../caixa.types';

interface Props {
    data: ICaixaDashboardData;
    empresa: any;
    watermark: any;
    periodo: string;
    forecast: IForecastMes[];
}

const CaixaPrint: React.FC<Props> = ({ data, empresa, watermark, periodo, forecast }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtShort = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
    const now = new Date();

    const entradas = (data.transacoes || []).filter(t => t.tipo === 'ENTRADA');
    const saidas = (data.transacoes || []).filter(t => t.tipo === 'SAIDA');
    const entradasTotal = entradas.reduce((acc, t) => acc + (t.valor || 0), 0);
    const saidasTotal = saidas.reduce((acc, t) => acc + (t.valor || 0), 0);

    // Forecast calculations for chart
    const forecastMaxValue = Math.max(...forecast.flatMap(f => [f.contas_pagar, f.contas_receber]), 1);
    const totalForecastPagar = forecast.reduce((a, f) => a + f.contas_pagar, 0);
    const totalForecastReceber = forecast.reduce((a, f) => a + f.contas_receber, 0);
    const totalForecastLucro = forecast.reduce((a, f) => a + f.lucro_projetado, 0);

    // Investimento por sócio totais
    const totalInvestido = data.investimento_socios.reduce((acc, s) => acc + s.valor_investido, 0);
    const totalCarros = data.investimento_socios.reduce((acc, s) => acc + s.quantidade_carros, 0);
    const totalLucroSocios = data.investimento_socios.reduce((acc, s) => acc + s.lucro_periodo, 0);

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 relative p-12 mx-auto print-container font-sans" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>

            {/* MARCA D'ÁGUA */}
            {watermark?.logo_url && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                    <img
                        src={watermark.logo_url}
                        style={{
                            opacity: (watermark.opacidade || 20) / 200,
                            transform: `scale(${(watermark.tamanho || 50) / 100})`,
                            maxWidth: '60%',
                            maxHeight: '60%',
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact' as any
                        }}
                        alt=""
                    />
                </div>
            )}

            <div className="relative z-10 flex flex-col">

                {/* ═══════════ CABEÇALHO DA EMPRESA ═══════════ */}
                <header className="flex items-center justify-between border-b-[3px] border-slate-900 pb-8 mb-10">
                    <div className="flex items-center space-x-8">
                        {empresa?.logo_url && (
                            <img src={empresa.logo_url} alt="Logo" className="h-28 w-auto object-contain max-w-[200px]" />
                        )}
                        <div>
                            <h1 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter leading-none mb-1">{empresa?.nome_fantasia || 'NOME DA EMPRESA'}</h1>
                            <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>{empresa?.razao_social}</span>
                                <span className="w-1 h-3 border-l border-slate-300"></span>
                                <span>CNPJ: {empresa?.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") || '—'}</span>
                            </div>
                            <div className="mt-2 text-[9px] font-medium text-slate-400 uppercase tracking-wide leading-snug">
                                <p>{empresa?.logradouro}, {empresa?.numero} - {empresa?.bairro} • {empresa?.cidade}/{empresa?.uf}</p>
                                <p className="mt-0.5">{empresa?.email} • {empresa?.telefone}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="inline-block bg-slate-900 text-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm mb-3" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                            Fluxo de Caixa & Patrimônio
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Período</p>
                            <p className="text-base font-black text-slate-900 uppercase tracking-tight">{periodo}</p>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                            Emitido: {now.toLocaleDateString('pt-BR')} às {now.toLocaleTimeString('pt-BR')}
                        </p>
                    </div>
                </header>

                {/* ═══════════ 1. KPIs EXECUTIVOS ═══════════ */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                        <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Resumo Executivo do Patrimônio</h2>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {[
                            { label: 'Patrimônio Líquido', val: data.patrimonio_liquido, bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-900' },
                            { label: 'Disponível (Caixa)', val: data.saldo_disponivel, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
                            { label: 'Ativos (Estoque)', val: data.total_ativos_estoque, bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
                            { label: 'Contas a Receber', val: data.total_recebiveis, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
                            { label: 'Passivo (À Pagar)', val: data.total_passivo_circulante, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
                        ].map((k, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${k.border} ${k.bg}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                                <p className={`text-sm font-[900] tracking-tight ${k.text}`}>{fmt(k.val)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════ 2. FLUXO DE RESULTADOS (Performance) ═══════════ */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                        <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Fluxo de Resultados do Período</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                            <div>
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Vendas (Recebido)</p>
                            </div>
                            <p className="text-lg font-[900] text-slate-900 tracking-tight">{fmtShort(data.total_vendas_recebido)}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex items-center justify-between" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                            <div>
                                <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Aquisições</p>
                            </div>
                            <p className="text-lg font-[900] text-slate-900 tracking-tight">{fmtShort(data.total_compras)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 flex items-center justify-between" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                            <div>
                                <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Lucro Realizado</p>
                                <p className="text-[7px] font-bold text-slate-500 mt-0.5">
                                    {data.total_vendas_recebido > 0 ? ((data.lucro_mensal / data.total_vendas_recebido) * 100).toFixed(1) : 0}% margem
                                </p>
                            </div>
                            <p className={`text-lg font-[900] tracking-tight ${data.lucro_mensal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.lucro_mensal > 0 ? '+' : ''}{fmtShort(data.lucro_mensal)}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-12 gap-8 mb-8">

                    {/* ═══════════ 3. SALDOS BANCÁRIOS (col esquerda) ═══════════ */}
                    <div className="col-span-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                            <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Saldos Bancários</h2>
                        </div>
                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                        <th className="pl-3 py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Banco</th>
                                        <th className="py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Titular</th>
                                        <th className="pr-3 py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.contas.map((c, i) => (
                                        <tr key={i}>
                                            <td className="pl-3 py-2 text-[9px] font-bold text-slate-700 uppercase">{c.banco_nome}</td>
                                            <td className="py-2 text-[8px] font-medium text-slate-400 uppercase">{c.titular}</td>
                                            <td className="pr-3 py-2 text-[9px] font-black text-slate-900 text-right">{fmt(Number(c.saldo_atual))}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                        <td colSpan={2} className="pl-3 py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Disponível</td>
                                        <td className="pr-3 py-2 text-[9px] font-black text-emerald-600 text-right">{fmt(data.saldo_disponivel)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ═══════════ 4. INVESTIMENTO POR SÓCIO - RESUMO (col direita) ═══════════ */}
                    <div className="col-span-7">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                                <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Investimento por Sócio</h2>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-[8px] font-black text-slate-400 uppercase">{totalCarros} veículos</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase">{data.investimento_socios.length} sócios</span>
                            </div>
                        </div>

                        {/* Totais rápidos */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Investido</p>
                                <p className="text-xs font-[900] text-slate-900">{fmt(totalInvestido)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Veículos</p>
                                <p className="text-xs font-[900] text-slate-900">{totalCarros}</p>
                            </div>
                            <div className={`rounded-lg p-2 border ${totalLucroSocios >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <p className={`text-[7px] font-black uppercase tracking-widest ${totalLucroSocios >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Lucro Mês</p>
                                <p className={`text-xs font-[900] ${totalLucroSocios >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{totalLucroSocios > 0 ? '+' : ''}{fmt(totalLucroSocios)}</p>
                            </div>
                        </div>

                        {/* Tabela de sócios */}
                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                        <th className="pl-3 py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Sócio</th>
                                        <th className="py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest text-center">Veic.</th>
                                        <th className="py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest text-center">%</th>
                                        <th className="py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest text-right">Investido</th>
                                        <th className="pr-3 py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest text-right">Lucro Mês</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.investimento_socios.map((s, i) => (
                                        <tr key={i}>
                                            <td className="pl-3 py-2 text-[9px] font-bold text-slate-800 uppercase">{s.nome}</td>
                                            <td className="py-2 text-[9px] font-bold text-slate-600 text-center">{s.quantidade_carros}</td>
                                            <td className="py-2 text-[9px] font-bold text-indigo-600 text-center">{s.porcentagem_estoque.toFixed(1)}%</td>
                                            <td className="py-2 text-[9px] font-black text-slate-900 text-right">{fmt(s.valor_investido)}</td>
                                            <td className={`pr-3 py-2 text-[9px] font-black text-right ${s.lucro_periodo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {s.lucro_periodo > 0 ? '+' : ''}{fmt(s.lucro_periodo)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ═══════════ 5. DETALHAMENTO VEÍCULOS POR SÓCIO ═══════════ */}
                <section className="mb-8 break-inside-avoid">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                        <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Detalhamento de Veículos por Sócio</h2>
                    </div>
                    <div className="space-y-4">
                        {data.investimento_socios.map((socio, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden break-inside-avoid">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-slate-900 text-white flex items-center justify-center font-black text-[10px] rounded-lg" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                            {socio.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-[900] uppercase text-slate-800">{socio.nome}</h3>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                                {socio.quantidade_carros} {socio.quantidade_carros === 1 ? 'veículo' : 'veículos'} • {socio.porcentagem_estoque.toFixed(1)}% do pátio
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Investido</p>
                                        <p className="text-xs font-[900] text-slate-900">{fmt(socio.valor_investido)}</p>
                                    </div>
                                </div>
                                {socio.veiculos.length > 0 ? (
                                    <div className="p-3">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                            {socio.veiculos.map((v, vIdx) => (
                                                <div key={vIdx} className="flex justify-between items-center text-[9px] py-1.5 border-b border-dashed border-slate-100 last:border-0 px-1">
                                                    <div>
                                                        <span className="font-extrabold text-slate-700 uppercase">{v.modelo}</span>
                                                        <span className="text-[8px] text-slate-400 ml-2 uppercase">{v.placa}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-900">{fmt(v.valor)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-3 text-center">
                                        <p className="text-[9px] text-slate-300 italic uppercase">Sem veículos no pátio</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {data.investimento_socios.length === 0 && (
                            <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Nenhum sócio com veículos no pátio</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ═══════════ 6. PREVISÃO FINANCEIRA - GRÁFICO ═══════════ */}
                {forecast.length > 0 && (
                    <section className="mb-8 break-before-page">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                                <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Previsão Financeira — Próximos 4 Meses</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-2 rounded-sm bg-emerald-500" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Receber</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-2 rounded-sm bg-rose-500" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Pagar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-1 rounded-full bg-indigo-500" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase">Lucro</span>
                                </div>
                            </div>
                        </div>

                        {/* Totais do forecast */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Total a Receber</p>
                                <p className="text-sm font-[900] text-emerald-700">{fmt(totalForecastReceber)}</p>
                            </div>
                            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Total a Pagar</p>
                                <p className="text-sm font-[900] text-rose-700">{fmt(totalForecastPagar)}</p>
                            </div>
                            <div className={`rounded-xl p-3 border ${totalForecastLucro >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <p className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${totalForecastLucro >= 0 ? 'text-indigo-500' : 'text-rose-500'}`}>Resultado Projetado</p>
                                <p className={`text-sm font-[900] ${totalForecastLucro >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                                    {totalForecastLucro > 0 ? '+' : ''}{fmt(totalForecastLucro)}
                                </p>
                            </div>
                        </div>

                        {/* SVG Chart */}
                        <div className="rounded-xl border border-slate-100 p-5 bg-slate-50/30" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                            <svg viewBox="0 0 500 220" className="w-full" style={{ height: 200 }}>
                                {/* Grid lines */}
                                {[0, 1, 2, 3, 4].map(i => {
                                    const y = 20 + (i * 40);
                                    return (
                                        <g key={i}>
                                            <line x1="50" y1={y} x2="480" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4 3" />
                                            <text x="45" y={y + 3} textAnchor="end" className="text-[8px]" fill="#94a3b8" fontSize="8" fontWeight="700">
                                                {new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(forecastMaxValue - (i * forecastMaxValue / 4))}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Bars and data */}
                                {forecast.map((f, i) => {
                                    const groupX = 70 + (i * 105);
                                    const barAreaH = 160;
                                    const receberH = (f.contas_receber / forecastMaxValue) * barAreaH;
                                    const pagarH = (f.contas_pagar / forecastMaxValue) * barAreaH;
                                    const baseY = 180;

                                    return (
                                        <g key={i}>
                                            {/* Barra Receber (verde) */}
                                            <rect
                                                x={groupX}
                                                y={baseY - receberH}
                                                width="30"
                                                height={Math.max(receberH, 1)}
                                                rx="4"
                                                fill="#10b981"
                                                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}
                                            />
                                            {/* Valor da barra Receber */}
                                            {f.contas_receber > 0 && (
                                                <text x={groupX + 15} y={baseY - receberH - 4} textAnchor="middle" fill="#10b981" fontSize="7" fontWeight="800">
                                                    {new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', style: 'currency', currency: 'BRL' }).format(f.contas_receber)}
                                                </text>
                                            )}

                                            {/* Barra Pagar (vermelha) */}
                                            <rect
                                                x={groupX + 38}
                                                y={baseY - pagarH}
                                                width="30"
                                                height={Math.max(pagarH, 1)}
                                                rx="4"
                                                fill="#f43f5e"
                                                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}
                                            />
                                            {/* Valor da barra Pagar */}
                                            {f.contas_pagar > 0 && (
                                                <text x={groupX + 53} y={baseY - pagarH - 4} textAnchor="middle" fill="#f43f5e" fontSize="7" fontWeight="800">
                                                    {new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', style: 'currency', currency: 'BRL' }).format(f.contas_pagar)}
                                                </text>
                                            )}

                                            {/* Label do mês */}
                                            <text x={groupX + 34} y={198} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="800" className="uppercase">
                                                {f.mes.split('/')[0]}
                                            </text>
                                            <text x={groupX + 34} y={210} textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="600">
                                                {f.mes.split('/')[1]}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Linha do Lucro */}
                                {forecast.length >= 2 && (() => {
                                    const barAreaH = 160;
                                    const baseY = 180;
                                    const points = forecast.map((f, i) => {
                                        const groupX = 70 + (i * 105) + 34;
                                        const lucroNorm = (f.lucro_projetado / forecastMaxValue) * barAreaH;
                                        const y = baseY - lucroNorm;
                                        const clampedY = Math.max(15, Math.min(baseY - 5, y));
                                        return { x: groupX, y: clampedY };
                                    });

                                    let pathD = `M ${points[0].x} ${points[0].y}`;
                                    for (let i = 1; i < points.length; i++) {
                                        const prev = points[i - 1];
                                        const curr = points[i];
                                        pathD += ` C ${prev.x + 35} ${prev.y}, ${curr.x - 35} ${curr.y}, ${curr.x} ${curr.y}`;
                                    }

                                    return (
                                        <g>
                                            {/* Fill area */}
                                            <path
                                                d={`${pathD} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`}
                                                fill="#6366f1"
                                                fillOpacity="0.08"
                                                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}
                                            />
                                            {/* Line */}
                                            <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }} />
                                            {/* Dots + labels */}
                                            {points.map((p, i) => (
                                                <g key={i}>
                                                    <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }} />
                                                    <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#6366f1" fontSize="7" fontWeight="800">
                                                        {new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short', style: 'currency', currency: 'BRL' }).format(forecast[i].lucro_projetado)}
                                                    </text>
                                                </g>
                                            ))}
                                        </g>
                                    );
                                })()}
                            </svg>
                        </div>

                        {/* Breakdown cards */}
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {forecast.map((f, i) => (
                                <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">{f.mes}</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[7px] font-bold text-emerald-500 uppercase">Receber</span>
                                            <span className="text-[8px] font-black text-emerald-600">{fmt(f.contas_receber)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[7px] font-bold text-rose-500 uppercase">Pagar</span>
                                            <span className="text-[8px] font-black text-rose-600">{fmt(f.contas_pagar)}</span>
                                        </div>
                                        <div className="border-t border-slate-100 pt-1 flex items-center justify-between">
                                            <span className="text-[7px] font-bold text-slate-400 uppercase">Resultado</span>
                                            <span className={`text-[8px] font-black ${f.lucro_projetado >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                {f.lucro_projetado > 0 ? '+' : ''}{fmt(f.lucro_projetado)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════ 7. MOVIMENTAÇÕES - ENTRADAS E SAÍDAS ═══════════ */}
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                        <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Movimentações do Período</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Entradas */}
                        <div className="rounded-xl border border-emerald-100 overflow-hidden">
                            <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Entradas (Crédito)</span>
                                </div>
                                <span className="text-[8px] font-black text-emerald-600 uppercase">{fmt(entradasTotal)}</span>
                            </div>
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-emerald-50">
                                    {entradas.slice(0, 15).map((t, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-1.5 text-[9px] text-slate-600">
                                                <span className="font-bold text-slate-800 block">{t.descricao || 'Sem descrição'}</span>
                                                <span className="text-[8px] text-slate-400">{new Date(t.data_pagamento).toLocaleDateString('pt-BR')}</span>
                                            </td>
                                            <td className="px-3 py-1.5 text-[9px] font-black text-emerald-600 text-right">{fmt(t.valor)}</td>
                                        </tr>
                                    ))}
                                    {entradas.length === 0 && (
                                        <tr><td colSpan={2} className="px-3 py-4 text-center text-[9px] text-slate-400 italic">Nenhuma entrada.</td></tr>
                                    )}
                                    {entradas.length > 15 && (
                                        <tr><td colSpan={2} className="px-3 py-2 text-center text-[8px] text-slate-400 font-bold">+{entradas.length - 15} mais registros...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Saídas */}
                        <div className="rounded-xl border border-rose-100 overflow-hidden">
                            <div className="px-3 py-2 bg-rose-50 border-b border-rose-100 flex items-center justify-between" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                                    <span className="text-[9px] font-black text-rose-800 uppercase tracking-wider">Saídas (Débito)</span>
                                </div>
                                <span className="text-[8px] font-black text-rose-600 uppercase">{fmt(saidasTotal)}</span>
                            </div>
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-rose-50">
                                    {saidas.slice(0, 15).map((t, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-1.5 text-[9px] text-slate-600">
                                                <span className="font-bold text-slate-800 block">{t.descricao || 'Sem descrição'}</span>
                                                <span className="text-[8px] text-slate-400">{new Date(t.data_pagamento).toLocaleDateString('pt-BR')}</span>
                                            </td>
                                            <td className="px-3 py-1.5 text-[9px] font-black text-rose-600 text-right">-{fmt(t.valor)}</td>
                                        </tr>
                                    ))}
                                    {saidas.length === 0 && (
                                        <tr><td colSpan={2} className="px-3 py-4 text-center text-[9px] text-slate-400 italic">Nenhuma saída.</td></tr>
                                    )}
                                    {saidas.length > 15 && (
                                        <tr><td colSpan={2} className="px-3 py-2 text-center text-[8px] text-slate-400 font-bold">+{saidas.length - 15} mais registros...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ═══════════ FOOTER ═══════════ */}
                <div className="mt-auto border-t-2 border-slate-900 pt-6 flex items-center justify-between">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">HCV Operating System • Documento Oficial</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Página 1</p>
                </div>
            </div>
        </div>
    );
};

export default CaixaPrint;
