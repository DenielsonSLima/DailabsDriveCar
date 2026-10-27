import React from 'react';
import type { ILoteUnidade } from '../../lotes.types';
import { money } from '../LoteUi';
import { LoteEmpty, tableTdClass, tableThClass } from './LoteDetailUi';

interface Props {
  unidades: ILoteUnidade[];
  encerrado: boolean;
  onIdentificar: (unidade: ILoteUnidade) => void;
}

export default function LoteUnidades({ unidades, encerrado, onIdentificar }: Props) {
  return (
    <details className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer p-5 text-base font-black uppercase tracking-tight text-slate-900 focus-visible:outline focus-visible:outline-indigo-600 sm:p-6">Unidades do lote <span className="ml-2 text-xs font-medium normal-case tracking-normal text-slate-500">{unidades.length} unidades · identificar quando necessário</span></summary>
      {unidades.length === 0 ? <LoteEmpty>Nenhuma unidade encontrada neste lote.</LoteEmpty> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <caption className="sr-only">Unidades geradas pelo lote</caption>
            <thead className="bg-slate-50"><tr>{['Unidade', 'Identificação', 'Situação', 'Custo atualizado', ''].map((label, index) => <th key={index} scope="col" className={tableThClass}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{unidades.map(unidade => (
              <tr key={unidade.id}>
                <td className={`${tableTdClass} font-bold`}>#{String(unidade.lote_ordem).padStart(2, '0')}</td>
                <td className={tableTdClass}>{unidade.placa || unidade.chassi || 'Ainda não informada'}</td>
                <td className={tableTdClass}>{{ DISPONIVEL: 'Disponível', VENDIDO: 'Vendida', RESERVADO: 'Reservada', PREPARACAO: 'Em preparação' }[unidade.status]}</td>
                <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{money(Number(unidade.valor_custo) + Number(unidade.valor_custo_servicos || 0))}</td>
                <td className={tableTdClass}><button type="button" disabled={encerrado} className="text-xs font-bold text-indigo-600 hover:underline focus-visible:outline focus-visible:outline-indigo-600 disabled:opacity-50" onClick={() => onIdentificar(unidade)}>Identificar</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </details>
  );
}
