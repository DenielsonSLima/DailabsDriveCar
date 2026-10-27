import React from 'react';
import { Link } from 'react-router-dom';
import type { ITitulo } from '../../../financeiro/financeiro.types';
import type { ILoteCatalogos, ILoteDetalhes, ILoteIndicadores, ILoteVenda } from '../../lotes.types';
import { getVendaRecebimentos } from '../../lotes.utils';
import { dateLabel, money, primaryClass } from '../LoteUi';
import { LoteEmpty, LoteMetric, LoteSection, tableTdClass, tableThClass } from './LoteDetailUi';
import LoteContas, { separarContasLote } from './LoteContas';

interface Props {
  detalhes: ILoteDetalhes;
  stats: ILoteIndicadores;
  catalogos?: ILoteCatalogos;
  canCreate: boolean;
  onReceber: (titulo: ITitulo) => void;
  onCancelar: (id: string) => void;
  onRegistrar: () => void;
  onDevolver: (venda: ILoteVenda) => void;
}

export default function LoteSaidas({ detalhes, stats, catalogos, canCreate, onReceber, onCancelar, onRegistrar, onDevolver }: Props) {
  const contas = separarContasLote(detalhes).saidas;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LoteMetric label="Vendas confirmadas" value={money(stats.vendido)} tone="indigo" />
        <LoteMetric label="Recebido dos clientes" value={money(stats.recebido)} tone="emerald" />
        <LoteMetric label="A receber" value={money(stats.aReceber)} tone="amber" />
        <LoteMetric label="Resultado das unidades vendidas" value={money(stats.resultado)} hint="Vendas menos custo atualizado das unidades vendidas" tone={stats.resultado < 0 ? 'rose' : 'emerald'} />
      </div>
      <LoteSection title="Vendas e recebimentos" subtitle="Venda confirmada reduz a quantidade disponível; as baixas financeiras atualizam o saldo a receber." action={<button type="button" className={primaryClass} disabled={!canCreate || stats.disponiveis === 0} onClick={onRegistrar}>Registrar venda</button>}>
        {detalhes.vendas.length === 0 ? <LoteEmpty>Nenhuma venda registrada para este lote.</LoteEmpty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <caption className="sr-only">Vendas do lote</caption>
              <thead className="bg-slate-50"><tr>{['Venda / cliente', 'Data', 'Unidades', 'Vendido', 'Recebido', 'A receber', ''].map((label, index) => <th key={index} scope="col" className={tableThClass}>{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{detalhes.vendas.map(venda => {
                const recebimentos = getVendaRecebimentos(detalhes, venda.id);
                const titulosVenda = new Set(detalhes.titulos.filter(item => item.venda_pedido_id === venda.id).map(item => item.id));
                const teveMovimentos = (detalhes.transacoes || []).some(item => titulosVenda.has(item.titulo_id));
                const precisaDevolucao = recebimentos.recebido > 0 || teveMovimentos;
                return (
                  <tr key={venda.id} className={venda.status === 'CANCELADO' ? 'bg-slate-50 opacity-70' : ''}>
                    <td className={tableTdClass}><Link to={`/pedidos-venda/${venda.id}`} className="font-bold text-indigo-600 hover:underline">{venda.numero_venda || 'Ver venda'}</Link><p className="mt-1">{venda.cliente_nome || catalogos?.parceiros.find(parceiro => parceiro.id === venda.cliente_id)?.nome || 'Cliente cadastrado'}</p>{venda.status === 'CANCELADO' && <span className="text-xs font-bold text-rose-600">Cancelada</span>}</td>
                    <td className={tableTdClass}>{dateLabel(venda.data_venda)}</td>
                    <td className={tableTdClass}>{venda.quantidade_lote}</td>
                    <td className={`${tableTdClass} whitespace-nowrap font-bold tabular-nums`}>{money(venda.valor_venda)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{money(recebimentos.recebido)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{money(recebimentos.aReceber)}</td>
                    <td className={tableTdClass}>{venda.status === 'CONCLUIDO' && !precisaDevolucao && <button type="button" disabled={!canCreate} className="text-xs font-bold text-rose-600 hover:underline focus-visible:outline focus-visible:outline-rose-600 disabled:opacity-50" onClick={() => onCancelar(venda.id)}>Cancelar venda</button>}{venda.status === 'CONCLUIDO' && precisaDevolucao && <button type="button" disabled={!canCreate} className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50" onClick={() => onDevolver(venda)}>Devolver venda integral</button>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </LoteSection>
      <LoteContas title="Contas a receber" titulos={contas} vendas={detalhes.vendas} catalogos={catalogos} canCreate={canCreate} onBaixar={onReceber} />
    </div>
  );
}
