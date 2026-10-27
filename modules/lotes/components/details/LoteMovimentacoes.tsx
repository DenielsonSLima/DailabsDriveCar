import React from 'react';
import type { ITitulo } from '../../../financeiro/financeiro.types';
import type { ILoteCatalogos, ILoteHistorico, ILoteTransacao, ILoteVenda } from '../../lotes.types';
import { money, secondaryClass } from '../LoteUi';
import { getContextoTituloLote } from './LoteContas';
import { LoteEmpty, tableTdClass, tableThClass } from './LoteDetailUi';

export function LoteMovimentacoes({ transacoes, titulos, vendas, catalogos, canOperate, onEstornar }: {
  transacoes: ILoteTransacao[];
  titulos: ITitulo[];
  vendas: ILoteVenda[];
  catalogos?: ILoteCatalogos;
  canOperate: boolean;
  onEstornar: (transacao: ILoteTransacao) => void;
}) {
  const estornadas = new Set(transacoes.flatMap(item => item.estorno_de_id ? [item.estorno_de_id] : []));
  return (
    <details className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer p-5 text-sm font-black text-slate-900 focus-visible:outline focus-visible:outline-indigo-600 sm:px-6">Histórico de pagamentos e recebimentos <span className="ml-2 text-xs font-medium text-slate-500">{transacoes.length} movimentos</span></summary>
      {transacoes.length === 0 ? <LoteEmpty>Nenhuma movimentação financeira registrada nesta aba.</LoteEmpty> : <div className="overflow-x-auto border-t border-slate-100">
        <table className="w-full min-w-[800px]">
          <caption className="sr-only">Movimentações financeiras do lote</caption>
          <thead className="bg-slate-50"><tr>{['Conta / referência', 'Data', 'Movimento', 'Valor', 'Situação', ''].map((label, index) => <th key={index} scope="col" className={tableThClass}>{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{transacoes.map(item => {
            const titulo = titulos.find(t => t.id === item.titulo_id);
            const isEstorno = !!item.estorno_de_id;
            const isEstornada = estornadas.has(item.id);
            const canReverse = !isEstorno && !isEstornada && item.tipo_transacao === 'RECEBIMENTO_TITULO' && !!item.conta_origem_id;
            return <tr key={item.id}>
              <td className={tableTdClass}><p className="font-bold text-slate-900">{item.conta_nome || 'Conta não informada'}</p><p className="mt-1 text-xs text-slate-500">{titulo ? getContextoTituloLote(titulo, vendas, catalogos) : item.descricao}</p></td>
              <td className={tableTdClass}>{new Date(item.data_pagamento).toLocaleDateString('pt-BR')}</td>
              <td className={tableTdClass}>{item.tipo === 'ENTRADA' ? 'Entrada' : item.tipo === 'SAIDA' ? 'Saída' : 'Transferência'}</td>
              <td className={`${tableTdClass} whitespace-nowrap font-bold tabular-nums`}>{money(item.valor)}</td>
              <td className={tableTdClass}><span className="text-xs font-bold text-slate-500">{isEstorno ? 'Estorno registrado' : isEstornada ? 'Estornada' : 'Registrada'}</span></td>
              <td className={tableTdClass}>{canReverse && <button type="button" className={secondaryClass} disabled={!canOperate} onClick={() => onEstornar(item)}>Estornar baixa</button>}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </details>
  );
}

const eventLabels: Record<string, string> = {
  CORRIGIR_DESPESA: 'Despesa corrigida', CANCELAR_DESPESA: 'Despesa cancelada',
  ESTORNAR_BAIXA: 'Baixa estornada', DEVOLVER_VENDA: 'Venda devolvida',
};

function despesaDoEvento(snapshot?: Record<string, unknown> | null) {
  return snapshot?.despesa && typeof snapshot.despesa === 'object' ? snapshot.despesa as Record<string, unknown> : snapshot;
}

export function LoteHistorico({ historico }: { historico: ILoteHistorico[] }) {
  return (
    <details className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer p-5 text-sm font-black text-slate-900 focus-visible:outline focus-visible:outline-indigo-600 sm:px-6">Histórico de correções e devoluções <span className="ml-2 text-xs font-medium text-slate-500">{historico.length} registros</span></summary>
      {historico.length === 0 ? <LoteEmpty>Nenhuma correção ou devolução registrada.</LoteEmpty> : <ol className="divide-y divide-slate-100 border-t border-slate-100">{historico.map(item => {
        const antes = despesaDoEvento(item.antes);
        const depois = despesaDoEvento(item.depois);
        return <li key={item.id} className="p-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{eventLabels[item.acao.toUpperCase()] || item.acao.replace(/_/g, ' ')}</p><time dateTime={item.created_at} className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString('pt-BR')}</time></div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{item.motivo}</p>
        {typeof antes?.descricao === 'string' && <p className="mt-2 text-xs text-slate-500">{antes.descricao}</p>}
        {typeof antes?.valor_total === 'number' && typeof depois?.valor_total === 'number' && antes.valor_total !== depois.valor_total && <p className="mt-2 text-xs font-bold text-slate-500">Valor: {money(antes.valor_total)} → {money(depois.valor_total)}</p>}
      </li>; })}</ol>}
    </details>
  );
}
