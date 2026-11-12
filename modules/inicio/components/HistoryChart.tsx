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
            <div className="dc-panel bg-opacity-95">
                <p className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-3 border-b border-slate-200 pb-2">
                    {labelTitle}
                </p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs font-medium text-slate-600 normal-case tracking-tight">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-900">
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
        <div className="dc-panel overflow-hidden group">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0 max-w-full">
                    <h3 className="dc-section-title">Histórico de Performance</h3>
                    <p className="dc-section-subtitle mt-1">Análise consolidada dos últimos 3 meses</p>
                </div>
                <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-xs font-semibold text-slate-600 normal-case tracking-normal">Patrimônio</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-xs font-semibold text-slate-600 normal-case tracking-normal">Vendas</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-slate-600 normal-case tracking-normal">Compras</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-xs font-semibold text-slate-600 normal-case tracking-normal">Despesas Ob.</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                        <span className="text-xs font-semibold text-slate-600 normal-case tracking-normal">Resultado</span>
                    </div>
                </div>
            </div>

            <div className="h-[280px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 18 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
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
