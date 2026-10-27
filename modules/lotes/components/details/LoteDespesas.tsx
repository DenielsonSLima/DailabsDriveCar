import React from 'react';
import type { ITitulo } from '../../../financeiro/financeiro.types';
import type { ILoteDetalhes, ILoteIndicadores } from '../../lotes.types';
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
}

export default function LoteDespesas({ detalhes, stats, canCreate, onPagar, onAdicionar }: Props) {
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
      <LoteSection title="Despesas do lote" subtitle="Fretes, mecânica e demais custos vinculados ao lote ou a uma unidade." action={<button type="button" className={primaryClass} disabled={!canCreate} onClick={onAdicionar}>Adicionar despesa</button>}>
        {detalhes.despesas.length === 0 ? <LoteEmpty>Nenhuma despesa registrada. Adicione frete, mecânica ou outros custos para acompanhar o investimento completo.</LoteEmpty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <caption className="sr-only">Despesas e situação de pagamento</caption>
              <thead className="bg-slate-50"><tr>{['Descrição', 'Aplicação', 'Vencimento', 'Valor', 'Pago', 'Em aberto', ''].map((label, index) => <th key={index} scope="col" className={tableThClass}>{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{detalhes.despesas.map(despesa => {
                const titulo = contas.find(item => item.id === despesa.titulo_id);
                const pendente = titulo ? getTituloPendente(titulo) : undefined;
                const unidade = detalhes.unidades.find(item => item.id === despesa.veiculo_id);
                return (
                  <tr key={despesa.id}>
                    <td className={tableTdClass}><p className="font-bold text-slate-900">{despesa.descricao}</p>{titulo?.status === 'CANCELADO' && <p className="mt-1 text-xs font-bold text-rose-600">Conta cancelada</p>}{despesa.comprovante_url && /^https?:\/\//i.test(despesa.comprovante_url) && <a className="mt-1 inline-block text-xs font-bold text-indigo-600 hover:underline" href={despesa.comprovante_url} target="_blank" rel="noreferrer">Ver comprovante ↗</a>}</td>
                    <td className={tableTdClass}>{despesa.veiculo_id ? `Unidade ${unidade?.lote_ordem || 'identificada'}` : 'Todo o lote'}</td>
                    <td className={tableTdClass}>{dateLabel(despesa.data_vencimento)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap font-bold tabular-nums`}>{money(despesa.valor_total)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{titulo ? money(titulo.valor_pago) : '—'}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{pendente === undefined ? 'Título indisponível' : money(pendente)}</td>
                    <td className={tableTdClass}>{titulo && (pendente || 0) > 0.005 && <button type="button" className={secondaryClass} disabled={!canCreate} onClick={() => onPagar(titulo)}>Pagar</button>}</td>
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
