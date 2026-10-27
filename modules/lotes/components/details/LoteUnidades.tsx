import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { ILoteUnidade, ILoteVenda } from '../../lotes.types';
import { fieldClass, money } from '../LoteUi';
import { LoteEmpty, LoteSection, tableTdClass, tableThClass } from './LoteDetailUi';

interface Props {
  unidades: ILoteUnidade[];
  encerrado: boolean;
  onIdentificar: (unidade: ILoteUnidade) => void;
  vendas?: ILoteVenda[];
}

type StatusFiltro = 'TODAS' | ILoteUnidade['status'];
const situacoes: Array<{ value: StatusFiltro; label: string }> = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'DISPONIVEL', label: 'Disponíveis' },
  { value: 'VENDIDO', label: 'Vendidas' },
  { value: 'RESERVADO', label: 'Reservadas' },
  { value: 'PREPARACAO', label: 'Em preparação' },
];
const statusLabels = { DISPONIVEL: 'Disponível', VENDIDO: 'Vendida', RESERVADO: 'Reservada', PREPARACAO: 'Em preparação' };
const statusColors = { DISPONIVEL: 'bg-emerald-50 text-emerald-700', VENDIDO: 'bg-slate-100 text-slate-600', RESERVADO: 'bg-amber-50 text-amber-700', PREPARACAO: 'bg-indigo-50 text-indigo-700' };

export function filtrarUnidadesLote(unidades: ILoteUnidade[], busca: string, status: StatusFiltro) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return unidades.filter(unidade => {
    if (status !== 'TODAS' && unidade.status !== status) return false;
    if (/^#?\d+$/.test(termo) && Number(termo.replace('#', '')) === unidade.lote_ordem) return true;
    return !termo || [`#${String(unidade.lote_ordem).padStart(2, '0')}`, String(unidade.lote_ordem), unidade.id || '', unidade.placa || '', unidade.chassi || '']
      .some(value => value.toLocaleLowerCase('pt-BR').includes(termo));
  });
}

export default function LoteUnidades({ unidades, encerrado, onIdentificar, vendas = [] }: Props) {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<StatusFiltro>('TODAS');
  const buscaId = useId();
  const filtradas = useMemo(() => filtrarUnidadesLote(unidades, busca, status), [unidades, busca, status]);
  const vendasPorUnidade = useMemo(() => {
    const map = new Map<string, ILoteVenda>();
    vendas.filter(venda => venda.status === 'CONCLUIDO').forEach(venda => {
      venda.itens?.forEach(item => map.set(item.veiculo_id, venda));
    });
    return map;
  }, [vendas]);

  return (
    <LoteSection title="Unidades do lote" subtitle={`${unidades.length} unidades · acompanhe identificação, custo e venda de cada unidade.`}>
      <div className="space-y-3 border-b border-slate-100 p-5 sm:px-6">
        <div className="relative max-w-lg">
          <label htmlFor={buscaId} className="sr-only">Buscar unidade por código, placa ou chassi</label>
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
          <input id={buscaId} type="search" className={`${fieldClass} pl-10`} placeholder="Buscar código, placa ou chassi..." value={busca} onChange={event => setBusca(event.target.value)} />
        </div>
        <div role="group" aria-label="Filtrar unidades por situação" className="flex flex-wrap gap-1.5">
          {situacoes.map(situacao => <button key={situacao.value} type="button" aria-pressed={status === situacao.value} onClick={() => setStatus(situacao.value)} className={`min-h-10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 ${status === situacao.value ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{situacao.label}</button>)}
        </div>
        <p aria-live="polite" className="text-xs text-slate-500">{filtradas.length} de {unidades.length} unidades</p>
      </div>
      {filtradas.length === 0 ? <LoteEmpty>{unidades.length === 0 ? 'Nenhuma unidade encontrada neste lote.' : 'Nenhuma unidade corresponde à busca e à situação selecionadas.'}</LoteEmpty> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <caption className="sr-only">Unidades geradas pelo lote</caption>
            <thead className="bg-slate-50"><tr>{['Unidade', 'Placa / chassi', 'Situação', 'Custo atualizado', 'Venda / cliente', ''].map((label, index) => <th key={index} scope="col" className={tableThClass}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{filtradas.map(unidade => {
              const venda = unidade.id ? vendasPorUnidade.get(unidade.id) : undefined;
              const itemVenda = venda?.itens?.find(item => item.veiculo_id === unidade.id);
              return <tr key={unidade.id}>
                <td className={`${tableTdClass} font-bold`}>#{String(unidade.lote_ordem).padStart(2, '0')}</td>
                <td className={tableTdClass}><p className="whitespace-nowrap font-bold text-slate-900">Placa: {unidade.placa || 'Não informada'}</p><p className="mt-1 break-all text-xs text-slate-500">Chassi: {unidade.chassi || 'Não informado'}</p></td>
                <td className={tableTdClass}><span className={`inline-flex whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusColors[unidade.status]}`}>{statusLabels[unidade.status]}</span></td>
                <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}><p className="font-bold text-slate-900">{money(Number(unidade.valor_custo) + Number(unidade.valor_custo_servicos || 0))}</p><p className="mt-1 text-xs text-slate-500">Compra: {money(Number(unidade.valor_custo))}</p><p className="mt-0.5 text-xs text-slate-500">Despesas: {money(Number(unidade.valor_custo_servicos || 0))}</p></td>
                <td className={tableTdClass}>{venda ? <><Link to={`/pedidos-venda/${venda.id}`} className="font-bold text-indigo-600 hover:underline">{venda.numero_venda || 'Ver venda'}</Link><p className="mt-1 text-xs text-slate-600">{venda.cliente_nome || 'Cliente cadastrado'}</p>{itemVenda && <p className="mt-1 whitespace-nowrap text-xs tabular-nums text-slate-500">Venda da unidade: {money(itemVenda.valor_venda)}</p>}</> : <span className="text-xs text-slate-400">{unidade.status === 'VENDIDO' ? 'Vínculo de venda indisponível' : 'Sem venda confirmada'}</span>}</td>
                <td className={tableTdClass}><button type="button" disabled={encerrado} className="text-xs font-bold text-indigo-600 hover:underline focus-visible:outline focus-visible:outline-indigo-600 disabled:opacity-50" onClick={() => onIdentificar(unidade)}>Identificar</button></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </LoteSection>
  );
}
