import React from 'react';
import type { ITitulo } from '../../../financeiro/financeiro.types';
import type { ILoteDespesa, ILoteDetalhes, ILoteIndicadores } from '../../lotes.types';
import { getTituloPendente } from '../../lotes.utils';
import { dateLabel, money, primaryClass, secondaryClass } from '../LoteUi';
import { LoteEmpty, LoteMetric, LoteSection, tableTdClass, tableThClass } from './LoteDetailUi';
import LoteContas, { separarContasLote, totaisContas } from './LoteContas';

interface Props {
  detalhes: ILoteDetalhes;
  stats: ILoteIndicadores;
  canCreate: boolean;
  onPagar: (titulo: ITitulo) => void;
  onAdicionar: () => void;
  onEditarDespesa?: (despesa: ILoteDespesa) => void;
  onCancelarDespesa?: (despesa: ILoteDespesa) => void;
}

export default function LoteDespesas({ detalhes, stats, canCreate, onPagar, onAdicionar, onEditarDespesa, onCancelarDespesa }: Props) {
  const contas = separarContasLote(detalhes).despesas;
  const financeiro = totaisContas(contas);
  const vinculadas = new Set(detalhes.despesas.map(despesa => despesa.titulo_id));
  const contasSemDespesa = contas.filter(titulo => !vinculadas.has(titulo.id));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <LoteMetric label="Despesas registradas" value={money(stats.despesas)} tone="indigo" />
        <LoteMetric label="Despesas pagas" value={money(financeiro.pago)} tone="emerald" />
        <LoteMetric label="Despesas a pagar" value={money(financeiro.pendente)} tone="amber" />
      </div>
      <LoteSection title="Despesas do lote" subtitle="Fretes, mecânica e demais custos vinculados ao lote ou a uma unidade." action={<button type="button" className={primaryClass} disabled={!canCreate || detalhes.lote.encerrado} onClick={onAdicionar}>Adicionar despesa</button>}>
        {detalhes.despesas.length === 0 ? <LoteEmpty>Nenhuma despesa registrada. Adicione frete, mecânica ou outros custos para acompanhar o investimento completo.</LoteEmpty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <caption className="sr-only">Despesas e situação de pagamento</caption>
              <thead className="bg-slate-50"><tr>{['Descrição', 'Aplicação', 'Vencimento', 'Valor', 'Pago', 'Em aberto', ''].map((label, index) => <th key={index} scope="col" className={tableThClass}>{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{detalhes.despesas.map(despesa => {
                const titulo = contas.find(item => item.id === despesa.titulo_id);
                const pendente = titulo ? getTituloPendente(titulo) : undefined;
                const unidade = detalhes.unidades.find(item => item.id === despesa.veiculo_id);
                const cancelada = !!despesa.cancelada;
                const temPagamentos = Number(titulo?.valor_pago || 0) > 0;
                const podeCorrigir = canCreate && !detalhes.lote.encerrado && !cancelada && !!titulo && titulo.status !== 'CANCELADO' && !temPagamentos;
                return (
                  <tr key={despesa.id} className={cancelada ? 'bg-slate-50' : ''}>
                    <td className={tableTdClass}><p className={`font-bold ${cancelada ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{despesa.descricao}</p>{cancelada ? <p className="mt-1 text-xs font-bold text-rose-600">Despesa cancelada · fora do custo ativo</p> : titulo?.status === 'CANCELADO' && <p className="mt-1 text-xs font-bold text-rose-600">Conta cancelada</p>}{despesa.comprovante_url && /^https?:\/\//i.test(despesa.comprovante_url) && <a className="mt-1 inline-block text-xs font-bold text-indigo-600 hover:underline" href={despesa.comprovante_url} target="_blank" rel="noreferrer">Ver comprovante ↗</a>}</td>
                    <td className={tableTdClass}>{despesa.veiculo_id ? `Unidade ${unidade?.lote_ordem || 'identificada'}` : 'Todo o lote'}</td>
                    <td className={tableTdClass}>{dateLabel(despesa.data_vencimento)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap font-bold tabular-nums ${cancelada ? 'text-slate-400 line-through' : ''}`}>{money(despesa.valor_total)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{titulo ? money(titulo.valor_pago) : '—'}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{pendente === undefined ? 'Título indisponível' : money(pendente)}</td>
                    <td className={`${tableTdClass} min-w-[210px]`}>
                      <div className="flex flex-wrap items-center gap-3">
                        {!cancelada && titulo && titulo.status !== 'CANCELADO' && (pendente || 0) > 0.005 && <button type="button" className={secondaryClass} disabled={!canCreate || detalhes.lote.encerrado} onClick={() => onPagar(titulo)}>Pagar</button>}
                        {onEditarDespesa && <button type="button" disabled={!podeCorrigir} onClick={() => { if (podeCorrigir) onEditarDespesa(despesa); }} className="min-h-10 text-xs font-bold text-indigo-600 hover:underline focus-visible:outline focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40">Editar</button>}
                        {onCancelarDespesa && <button type="button" disabled={!podeCorrigir} onClick={() => { if (podeCorrigir) onCancelarDespesa(despesa); }} className="min-h-10 text-xs font-bold text-rose-600 hover:underline focus-visible:outline focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-40">Cancelar</button>}
                      </div>
                      {!cancelada && temPagamentos && (onEditarDespesa || onCancelarDespesa) && <p className="mt-1 max-w-60 text-xs leading-relaxed text-slate-500">Estorne os pagamentos no histórico antes de corrigir ou cancelar.</p>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </LoteSection>
      {contasSemDespesa.length > 0 && <LoteContas title="Outras contas de despesas" titulos={contasSemDespesa} canCreate={canCreate} onBaixar={onPagar} />}
    </div>
  );
}
