import React from 'react';
import PerformanceBaseTable from './PerformanceBaseTable';
import { IPerformanceVenda, IPerformanceCompra, IPerformanceTitulo, IPerformanceDespesaVeiculo, IPerformanceRetirada, IPerformanceEstoque } from '../../performance.types';

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDate = (d: string) => {
    if (!d) return '-';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
};

const statusColor: Record<string, string> = {
    PAGO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
    PARCIAL: 'bg-blue-50 text-blue-700 border-blue-200',
    ATRASADO: 'bg-rose-50 text-rose-700 border-rose-200',
};

interface TableProps {
    variant?: 'screen' | 'print';
}

// ===================== VENDAS =====================
export const VendasTable: React.FC<TableProps & { data: IPerformanceVenda[] }> = ({ data, variant = 'screen' }) => {
    const isPrint = variant === 'print';
    const headers = isPrint
        ? ['Nº', 'Data', 'Cliente', 'Veículo', 'Custo', 'Venda', 'Lucro', 'Margem']
        : ['Nº', 'Data', 'Cliente', 'Veículo', 'Custo', 'Venda', 'Lucro', 'Margem'];

    const rows = (isPrint ? data.slice(0, 20) : data).map((v) => (
        <tr key={v.id} className={isPrint ? '' : 'hover:bg-slate-50/50 transition-colors'}>
            <td className={`${isPrint ? 'pl-3 py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-500`}>{v.numero_venda}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[8px] text-slate-500 font-mono`}>{formatDate(v.data_venda)}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-700 ${isPrint ? 'max-w-[100px] truncate' : ''}`}>{v.cliente_nome}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'}`}>
                <p className={`${isPrint ? 'text-[9px]' : 'text-xs'} font-black text-slate-800 uppercase tracking-tighter`}>{v.veiculo_modelo}</p>
                <p className={`${isPrint ? 'text-[8px]' : 'text-[10px]'} text-slate-400 font-mono`}>{v.veiculo_placa}</p>
            </td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-500 text-right`}>{formatCurrency(v.custo_veiculo + v.custo_servicos)}</td>
            <td className={`${isPrint ? 'py-1.5 font-black' : 'px-5 py-3 font-black'} text-indigo-600 text-right text-[9px]`}>{formatCurrency(v.valor_venda)}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-black text-right ${v.lucro_bruto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(v.lucro_bruto)}</td>
            <td className={`${isPrint ? 'pr-3 py-1.5' : 'px-5 py-3'} text-center`}>
                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black border ${v.margem_percent >= 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : v.margem_percent >= 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    {v.margem_percent.toFixed(1)}%
                </span>
            </td>
        </tr>
    ));

    return (
        <PerformanceBaseTable headers={headers} variant={variant}>
            {rows}
            {isPrint && data.length > 20 && (
                <tr><td colSpan={8} className="px-3 py-2 text-center text-[8px] text-slate-400 font-bold">+{data.length - 20} mais registros...</td></tr>
            )}
        </PerformanceBaseTable>
    );
};

// ===================== COMPRAS =====================
export const ComprasTable: React.FC<TableProps & { data: IPerformanceCompra[] }> = ({ data, variant = 'screen' }) => {
    const isPrint = variant === 'print';
    const headers = ['Nº', 'Data', 'Fornecedor', 'Veículo', 'Valor'];

    const rows = (isPrint ? data.slice(0, 20) : data).map((c) => (
        <tr key={c.id} className={isPrint ? '' : 'hover:bg-slate-50/50 transition-colors'}>
            <td className={`${isPrint ? 'pl-3 py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-500`}>{c.numero_pedido}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[8px] text-slate-500 font-mono`}>{formatDate(c.data_compra)}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-700`}>{c.fornecedor_nome}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'}`}>
                <p className={`${isPrint ? 'text-[9px]' : 'text-xs'} font-black text-slate-800 uppercase tracking-tighter`}>{c.veiculo_modelo}</p>
                <p className={`${isPrint ? 'text-[8px]' : 'text-[10px]'} text-slate-400 font-mono`}>{c.veiculo_placa}</p>
            </td>
            <td className={`${isPrint ? 'pr-3 py-1.5' : 'px-5 py-3'} text-[9px] font-black text-slate-900 text-right`}>{formatCurrency(c.valor_negociado)}</td>
        </tr>
    ));

    return (
        <PerformanceBaseTable headers={headers} variant={variant}>
            {rows}
            {isPrint && data.length > 20 && (
                <tr><td colSpan={5} className="px-3 py-2 text-center text-[8px] text-slate-400 font-bold">+{data.length - 20} mais registros...</td></tr>
            )}
        </PerformanceBaseTable>
    );
};

// ===================== TÍTULOS =====================
export const TitulosTable: React.FC<TableProps & { data: IPerformanceTitulo[] }> = ({ data, variant = 'screen' }) => {
    const isPrint = variant === 'print';
    const headers = isPrint ? ['Descrição', 'Valor'] : ['Descrição', 'Parceiro', 'Categoria', 'Vencimento', 'Valor', 'Pago', 'Status'];

    const rows = (isPrint ? data.slice(0, 15) : data).map((t) => (
        <tr key={t.id} className={isPrint ? '' : 'hover:bg-slate-50/50 transition-colors'}>
            <td className={`${isPrint ? 'px-3 py-1.5' : 'px-5 py-3'} text-[9px] text-slate-600`}>
                <span className={`font-bold text-slate-800 block ${isPrint ? 'max-w-[150px] truncate' : 'max-w-[200px] truncate'}`}>{t.descricao}</span>
                {isPrint && <span className="text-[8px] text-slate-400">{formatDate(t.data_vencimento)} • {t.parceiro_nome}</span>}
            </td>
            {!isPrint && (
                <>
                    <td className="px-5 py-3 text-xs text-slate-500">{t.parceiro_nome}</td>
                    <td className="px-5 py-3 text-[11px] text-slate-400">{t.categoria_nome}</td>
                    <td className="px-5 py-3 text-[11px] text-slate-500 font-mono">{formatDate(t.data_vencimento)}</td>
                </>
            )}
            <td className={`${isPrint ? 'px-3 py-1.5' : 'px-5 py-3'} text-[9px] font-black text-right ${isPrint ? 'text-indigo-600' : 'text-slate-900'}`}>{formatCurrency(t.valor_total)}</td>
            {!isPrint && (
                <>
                    <td className="px-5 py-3 text-xs font-bold text-emerald-600 text-right">{formatCurrency(t.valor_pago)}</td>
                    <td className="px-5 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black border ${statusColor[t.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {t.status}
                        </span>
                    </td>
                </>
            )}
        </tr>
    ));

    return (
        <PerformanceBaseTable headers={headers} variant={variant}>
            {rows}
            {isPrint && data.length > 15 && (
                <tr><td colSpan={2} className="px-3 py-2 text-center text-[8px] text-slate-400 font-bold">+{data.length - 15} mais...</td></tr>
            )}
        </PerformanceBaseTable>
    );
};

// ===================== DESPESAS VEÍCULOS =====================
export const DespesasTable: React.FC<TableProps & { data: IPerformanceDespesaVeiculo[] }> = ({ data, variant = 'screen' }) => {
    const isPrint = variant === 'print';
    const headers = isPrint ? ['Veículo', 'Descrição', 'Data', 'Valor'] : ['Veículo', 'Descrição', 'Data', 'Valor', 'Pagamento'];

    const rows = (isPrint ? data.slice(0, 20) : data).map((d) => (
        <tr key={d.id} className={isPrint ? '' : 'hover:bg-slate-50/50 transition-colors'}>
            <td className={`${isPrint ? 'pl-3 py-1.5' : 'px-5 py-3'}`}>
                <p className={`${isPrint ? 'text-[9px]' : 'text-xs'} font-black text-slate-800 uppercase tracking-tighter`}>{d.veiculo_modelo}</p>
                <p className={`${isPrint ? 'text-[8px]' : 'text-[10px]'} text-slate-400 font-mono`}>{d.veiculo_placa}</p>
            </td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-700 ${isPrint ? 'max-w-[140px] truncate' : ''}`}>{d.descricao}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[8px] text-slate-500 font-mono`}>{formatDate(d.data)}</td>
            <td className={`${isPrint ? 'pr-3 py-1.5' : 'px-5 py-3'} text-[9px] font-black text-rose-600 text-right`}>{formatCurrency(d.valor_total)}</td>
            {!isPrint && (
                <td className="px-5 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black border ${statusColor[d.status_pagamento] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {d.status_pagamento}
                    </span>
                </td>
            )}
        </tr>
    ));

    return (
        <PerformanceBaseTable headers={headers} variant={variant}>
            {rows}
            {isPrint && data.length > 20 && (
                <tr><td colSpan={4} className="px-3 py-2 text-center text-[8px] text-slate-400 font-bold">+{data.length - 20} mais registros...</td></tr>
            )}
        </PerformanceBaseTable>
    );
};

// ===================== RETIRADAS =====================
export const RetiradasTable: React.FC<TableProps & { data: IPerformanceRetirada[] }> = ({ data, variant = 'screen' }) => {
    const isPrint = variant === 'print';
    const headers = ['Sócio', 'Tipo', 'Descrição', 'Data', 'Valor'];

    const rows = data.map((ret) => (
        <tr key={ret.id} className={isPrint ? '' : 'hover:bg-slate-50/50 transition-colors'}>
            <td className={`${isPrint ? 'pl-3 py-1.5' : 'px-5 py-3'} text-[9px] font-black text-slate-800 uppercase`}>{ret.socio_nome}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[8px] text-slate-500 uppercase`}>{ret.tipo}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-700 ${isPrint ? 'max-w-[120px] truncate' : ''}`}>{ret.descricao}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[8px] text-slate-500 font-mono`}>{formatDate(ret.data)}</td>
            <td className={`${isPrint ? 'pr-3 py-1.5' : 'px-5 py-3'} text-[9px] font-black text-rose-600 text-right`}>{formatCurrency(ret.valor)}</td>
        </tr>
    ));

    return (
        <PerformanceBaseTable headers={headers} variant={variant}>
            {rows}
        </PerformanceBaseTable>
    );
};

// ===================== ESTOQUE =====================
export const EstoqueTable: React.FC<TableProps & { data: IPerformanceEstoque[] }> = ({ data, variant = 'screen' }) => {
    const isPrint = variant === 'print';
    const headers = isPrint
        ? ['Veículo', 'Status', 'Custo', 'Venda', 'Margem', 'Dias']
        : ['Veículo', 'Status', 'Custo', 'Serviços', 'Preço Venda', 'Margem', 'Dias'];

    const rows = data.map((e) => (
        <tr key={e.id} className={`${isPrint ? '' : 'hover:bg-slate-50/50 transition-colors'} ${e.dias_estoque > 60 ? 'bg-rose-50/30' : ''}`}>
            <td className={`${isPrint ? 'pl-3 py-1.5' : 'px-5 py-3'}`}>
                <p className={`${isPrint ? 'text-[9px]' : 'text-xs'} font-black text-slate-800 uppercase tracking-tighter`}>{e.modelo}</p>
                <p className={`${isPrint ? 'text-[8px]' : 'text-[10px]'} text-slate-400 font-mono`}>{e.placa}</p>
            </td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'}`}>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${e.status === 'DISPONIVEL' ? 'bg-emerald-50 text-emerald-600' :
                        e.status === 'RESERVADO' ? 'bg-blue-50 text-blue-600' :
                            'bg-amber-50 text-amber-600'
                    }`}>{e.status}</span>
            </td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-bold text-slate-500 text-right`}>{formatCurrency(e.valor_custo + (isPrint ? e.valor_custo_servicos : 0))}</td>
            {!isPrint && <td className="px-5 py-3 text-xs font-bold text-slate-500 text-right">{formatCurrency(e.valor_custo_servicos)}</td>}
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-black text-indigo-600 text-right`}>{formatCurrency(e.valor_venda)}</td>
            <td className={`${isPrint ? 'py-1.5' : 'px-5 py-3'} text-[9px] font-black text-right ${e.margem_percent >= 10 ? 'text-emerald-600' : e.margem_percent >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>{e.margem_percent.toFixed(1)}%</td>
            <td className={`${isPrint ? 'pr-3 py-1.5' : 'px-5 py-3'} text-[9px] font-black text-right ${e.dias_estoque > 60 ? 'text-rose-500' : e.dias_estoque > 30 ? 'text-amber-500' : 'text-slate-700'}`}>{e.dias_estoque}d</td>
        </tr>
    ));

    return (
        <PerformanceBaseTable headers={headers} variant={variant}>
            {rows}
        </PerformanceBaseTable>
    );
};
