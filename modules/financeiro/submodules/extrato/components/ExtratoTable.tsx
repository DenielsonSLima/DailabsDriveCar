import React from 'react';
import { IHistoricoUnificado } from '../../../financeiro.types';

interface Props {
  items: IHistoricoUnificado[];
  loading: boolean;
}

const ExtratoTable: React.FC<Props> = ({ items, loading }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => {
    if (!date) return '---';
    return new Date(date + (date.length <= 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Consolidando Movimentações...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-slate-200">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sem movimentações no período selecionado</p>
      </div>
    );
  }

  const getTipoLabel = (h: IHistoricoUnificado) => {
    switch (h.tipo_movimento) {
      case 'ENTRADA': return 'Entrada';
      case 'SAIDA': return 'Saída';
      case 'TRANSFERENCIA': return 'Transferência';
      case 'A_PAGAR': return 'A Pagar';
      case 'A_RECEBER': return 'A Receber';
      default: return h.tipo_movimento;
    }
  };

  const getTipoColor = (h: IHistoricoUnificado) => {
    switch (h.tipo_movimento) {
      case 'ENTRADA': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SAIDA': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TRANSFERENCIA': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'A_PAGAR': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'A_RECEBER': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getOrigemLabel = (h: IHistoricoUnificado) => {
    switch (h.origem) {
      case 'COMPRA': return 'Compra';
      case 'VENDA': return 'Venda';
      case 'DESPESA_VEICULO': return 'Despesa Veículo';
      case 'TRANSFERENCIA': return 'Transferência';
      case 'RETIRADA': return 'Retirada';
      case 'CREDITO': return 'Crédito';
      case 'SALDO_INICIAL': return 'Saldo Inicial';
      case 'MANUAL': return 'Manual';
      default: return h.origem;
    }
  };

  const getOrigemColor = (h: IHistoricoUnificado) => {
    switch (h.origem) {
      case 'COMPRA': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'VENDA': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DESPESA_VEICULO': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'TRANSFERENCIA': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'RETIRADA': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'SALDO_INICIAL': return 'bg-slate-50 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getStatusLabel = (h: IHistoricoUnificado) => {
    switch (h.status) {
      case 'REALIZADO': return 'Realizado';
      case 'PENDENTE': return 'Pendente';
      case 'PARCIAL': return 'Parcial';
      case 'ATRASADO': return 'Atrasado';
      case 'CANCELADO': return 'Cancelado';
      default: return h.status;
    }
  };

  const getStatusColor = (h: IHistoricoUnificado) => {
    switch (h.status) {
      case 'REALIZADO': return 'bg-emerald-500 text-white';
      case 'PENDENTE': return 'bg-amber-400 text-white';
      case 'PARCIAL': return 'bg-blue-400 text-white';
      case 'ATRASADO': return 'bg-rose-500 text-white';
      case 'CANCELADO': return 'bg-slate-300 text-white';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  const getValorColor = (h: IHistoricoUnificado) => {
    if (h.tipo_movimento === 'ENTRADA' || h.tipo_movimento === 'A_RECEBER') return 'text-emerald-600';
    if (h.tipo_movimento === 'SAIDA' || h.tipo_movimento === 'A_PAGAR') return 'text-rose-600';
    return 'text-blue-600';
  };

  const getValorPrefix = (h: IHistoricoUnificado) => {
    if (h.tipo_movimento === 'ENTRADA' || h.tipo_movimento === 'A_RECEBER') return '+';
    if (h.tipo_movimento === 'SAIDA' || h.tipo_movimento === 'A_PAGAR') return '-';
    return '';
  };

  const getDotColor = (h: IHistoricoUnificado) => {
    if (h.status === 'ATRASADO') return 'bg-rose-500 animate-pulse';
    if (h.tipo_movimento === 'ENTRADA') return 'bg-emerald-500';
    if (h.tipo_movimento === 'SAIDA') return 'bg-rose-500';
    if (h.tipo_movimento === 'A_PAGAR') return 'bg-orange-400';
    if (h.tipo_movimento === 'A_RECEBER') return 'bg-teal-400';
    return 'bg-blue-500';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <th className="px-6 py-5">Data</th>
            <th className="px-6 py-5">Descrição / Origem</th>
            <th className="px-6 py-5">Parceiro</th>
            <th className="px-6 py-5 text-center">Tipo</th>
            <th className="px-6 py-5 text-center">Status</th>
            <th className="px-6 py-5 text-center">Forma / Parcela</th>
            <th className="px-6 py-5 text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((h) => (
            <tr key={h.id} className={`hover:bg-slate-50/50 transition-colors group ${h.status === 'ATRASADO' ? 'bg-rose-50/30' : ''}`}>
              {/* Data */}
              <td className="px-6 py-4">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{formatDate(h.data)}</span>
                {h.data_emissao && h.data_emissao !== h.data && (
                  <p className="text-[9px] text-slate-400 mt-0.5">Emissão: {formatDate(h.data_emissao)}</p>
                )}
              </td>

              {/* Descrição + Badges */}
              <td className="px-6 py-4 max-w-xs">
                <div className="flex items-start space-x-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${getDotColor(h)}`}></span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tighter truncate" title={h.descricao}>
                      {h.descricao}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tight border ${getOrigemColor(h)}`}>
                        {getOrigemLabel(h)}
                      </span>
                      {h.pedido_ref && (
                        <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tight bg-violet-50 text-violet-600 border border-violet-100">
                          {h.pedido_ref}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {/* Parceiro */}
              <td className="px-6 py-4">
                <span className="text-[11px] font-bold text-slate-600">
                  {h.parceiro_nome || '—'}
                </span>
              </td>

              {/* Tipo Movimentação */}
              <td className="px-6 py-4 text-center">
                <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tight border ${getTipoColor(h)}`}>
                  {getTipoLabel(h)}
                </span>
              </td>

              {/* Status */}
              <td className="px-6 py-4 text-center">
                <span className={`inline-block px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tight ${getStatusColor(h)}`}>
                  {getStatusLabel(h)}
                </span>
              </td>

              {/* Forma / Parcela */}
              <td className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-100 whitespace-nowrap">
                    {h.forma_pagamento || 'DIRETO'}
                  </span>
                  {h.conta_nome && (
                    <span className="text-[9px] text-indigo-600 font-black uppercase tracking-widest mt-1 bg-indigo-50/50 px-1.5 py-0.5 rounded leading-none">
                      {h.conta_nome}
                    </span>
                  )}
                  {h.parcela_info && (
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">{h.parcela_info}</p>
                  )}
                </div>
              </td>

              {/* Valor */}
              <td className="px-6 py-4 text-right">
                <span className={`text-sm font-black ${getValorColor(h)}`}>
                  {getValorPrefix(h)} {formatCurrency(h.source === 'TITULO' ? (h.valor_restante || h.valor) : h.valor)}
                </span>
                {h.source === 'TITULO' && h.valor_pago !== undefined && h.valor_pago > 0 && (
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Pago: {formatCurrency(h.valor_pago)} de {formatCurrency(h.valor)}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExtratoTable;
