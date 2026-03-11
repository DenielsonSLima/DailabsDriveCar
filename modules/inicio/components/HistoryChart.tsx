import React, { useMemo } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { IHistoryData } from '../inicio.types';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const date = new Date(data.mes + 'T00:00:00');
        const labelTitle = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        return (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl bg-opacity-95">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                    {labelTitle}
                </p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="text-xs font-black text-white">
                                {formatCurrency(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export const HistoryChart = ({ data }: { data: IHistoryData[] }) => {
    const chartData = useMemo(() => {
        return data.map((d) => ({
            ...d,
            displayDate: new Date(d.mes + 'T00:00:00').toLocaleDateString('pt-BR', {
                month: 'short',
                year: '2-digit',
            }),
        }));
    }, [data]);

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Histórico de Performance</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análise consolidada dos últimos 3 meses</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Patrimônio</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Vendas</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Compras</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Despesas Ob.</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Resultado</span>
                    </div>
                </div>
            </div>

            <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                            tickFormatter={(val) => `R$ ${val / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                        <Bar
                            name="Patrimônio"
                            dataKey="estoque_valor"
                            fill="#cbd5e1"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            name="Vendas"
                            dataKey="vendas_valor"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            name="Compras Veículos"
                            dataKey="compras_valor"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Bar
                            name="Despesas Op."
                            dataKey="despesas_valor"
                            fill="#f43f5e"
                            radius={[4, 4, 0, 0]}
                            barSize={20}
                        />
                        <Line
                            type="monotone"
                            name="Lucro Mensal"
                            dataKey="lucro_valor"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
