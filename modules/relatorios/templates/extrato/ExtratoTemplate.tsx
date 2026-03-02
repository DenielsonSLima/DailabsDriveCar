import React from 'react';
import BaseReportLayout from '../BaseReportLayout';

interface Props {
    empresa: any;
    watermark: any;
    data: any;
}

const ExtratoTemplate: React.FC<Props> = ({ empresa, watermark, data }) => {
    const formatCur = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const formatDate = (date: string) => {
        const d = new Date(date + 'T12:00:00');
        return d.toLocaleDateString('pt-BR');
    };

    const { transacoes, saldoAnterior, saldoFinal, contaNome, periodo, tipoFiltro } = data;

    return (
        <BaseReportLayout
            empresa={empresa}
            watermark={watermark}
            title="Extrato de Movimentação"
            subtitle={`Conta: ${contaNome || 'N/A'} • Período: ${periodo}`}
        >
            <div className="space-y-8">
                {/* Sumário de Saldos */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Anterior</p>
                        <p className={`text-lg font-black ${saldoAnterior >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>{formatCur(saldoAnterior)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Movimentado</p>
                        <p className="text-lg font-black text-indigo-600">{formatCur(saldoFinal - saldoAnterior)}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl text-white">
                        <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Saldo Final</p>
                        <p className={`text-lg font-black ${saldoFinal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCur(saldoFinal)}</p>
                    </div>
                </div>

                {/* Tabela de Lançamentos */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[9px]">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                                <th className="px-4 py-3 font-black uppercase text-slate-500">Data</th>
                                <th className="px-4 py-3 font-black uppercase text-slate-500">Descrição / Parceiro</th>
                                <th className="px-4 py-3 font-black uppercase text-slate-500">Forma</th>
                                <th className="px-4 py-3 font-black uppercase text-slate-500 text-right">Entrada (+)</th>
                                <th className="px-4 py-3 font-black uppercase text-slate-500 text-right">Saída (-)</th>
                                <th className="px-4 py-3 font-black uppercase text-slate-500 text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Linha Saldo Inicial */}
                            <tr className="bg-slate-50/50">
                                <td className="px-4 py-2 font-bold uppercase text-slate-400" colSpan={5}>Saldo Inicial do Período</td>
                                <td className="px-4 py-2 text-right font-black text-slate-900">{formatCur(saldoAnterior)}</td>
                            </tr>

                            {transacoes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        Nenhuma movimentação encontrada
                                    </td>
                                </tr>
                            ) : transacoes.map((item: any, i: number) => {
                                const isCredito = item.tipo === 'ENTRADA';
                                return (
                                    <tr key={i}>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.data_pagamento)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold uppercase text-slate-800">{item.descricao || '-'}</span>
                                                {item.titulo?.parceiro?.nome && (
                                                    <span className="text-[7px] text-slate-400 uppercase tracking-tighter">{item.titulo.parceiro.nome}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 uppercase text-slate-500">{item.forma_pagamento?.nome || '-'}</td>
                                        <td className="px-4 py-3 text-right font-black text-emerald-600">{isCredito ? formatCur(item.valor) : ''}</td>
                                        <td className="px-4 py-3 text-right font-black text-rose-600 font-black">{!isCredito ? formatCur(item.valor) : ''}</td>
                                        <td className={`px-4 py-3 text-right font-black ${item.saldoMomentaneo >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                                            {tipoFiltro ? '---' : formatCur(item.saldoMomentaneo)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-900 text-white font-black uppercase text-[10px]">
                                <td className="px-4 py-4" colSpan={5}>Saldo Final do Período</td>
                                <td className="px-4 py-4 text-right underline underline-offset-4 decoration-indigo-500">
                                    {tipoFiltro ? '---' : formatCur(saldoFinal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </BaseReportLayout>
    );
};

export default ExtratoTemplate;
