import React from 'react';
import { Link } from 'react-router-dom';
import type { ITitulo } from '../../../financeiro/financeiro.types';
import type { ILoteDetalhes, ILoteIndicadores, ILoteUnidade } from '../../lotes.types';
import { money } from '../LoteUi';
import { LoteMetric, LoteSection } from './LoteDetailUi';
import LoteContas, { separarContasLote, totaisContas } from './LoteContas';
import LoteUnidades from './LoteUnidades';

interface Props {
  detalhes: ILoteDetalhes;
  stats: ILoteIndicadores;
  canCreate: boolean;
  onPagar: (titulo: ITitulo) => void;
  onIdentificar: (unidade: ILoteUnidade) => void;
}

export default function LoteEntrada({ detalhes, stats, canCreate, onPagar, onIdentificar }: Props) {
  const contas = separarContasLote(detalhes).entrada;
  const financeiro = totaisContas(contas);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LoteMetric label="Unidades adquiridas" value={String(stats.compradas)} />
        <LoteMetric label="Compra do lote" value={money(stats.custoAquisicao)} tone="indigo" />
        <LoteMetric label="Compra paga" value={money(financeiro.pago)} tone="emerald" />
        <LoteMetric label="Compra a pagar" value={money(financeiro.pendente)} tone="amber" />
      </div>
      <LoteSection title="Entrada do lote" subtitle="Compra que originou as unidades e o custo de aquisição.">
        <dl className="grid gap-4 p-4 sm:grid-cols-3">
          <div><dt className="text-xs font-semibold normal-case tracking-normal text-slate-400">Descrição</dt><dd className="mt-2 text-sm font-bold text-slate-900">{detalhes.lote.descricao}</dd></div>
          <div><dt className="text-xs font-semibold normal-case tracking-normal text-slate-400">Registro do lote</dt><dd className="mt-2 text-sm font-bold text-slate-900">{new Date(detalhes.lote.created_at).toLocaleDateString('pt-BR')}</dd></div>
          <div><dt className="text-xs font-semibold normal-case tracking-normal text-slate-400">Pedido de origem</dt><dd className="mt-2"><Link to={`/pedidos-compra/${detalhes.lote.pedido_id}`} className="text-sm font-bold text-indigo-600 hover:underline">Ver pedido de compra →</Link></dd></div>
        </dl>
      </LoteSection>
      <LoteContas title="Contas da compra" titulos={contas} canCreate={canCreate} onBaixar={onPagar} />
      <LoteUnidades unidades={detalhes.unidades} encerrado={detalhes.lote.encerrado} onIdentificar={onIdentificar} />
    </div>
  );
}
