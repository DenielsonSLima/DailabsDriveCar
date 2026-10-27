import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ILoteDetalhes, ILoteIndicadores } from '../../lotes.types';
import { money, secondaryClass } from '../LoteUi';
import { LoteMetric, LoteSection } from './LoteDetailUi';
import type { LoteDetalhesTab } from './LoteDetailUi';

interface Props {
  detalhes: ILoteDetalhes;
  stats: ILoteIndicadores;
  onEncerrar: () => void;
  canClose: boolean;
  onNavigate: (tab: LoteDetalhesTab) => void;
}

export function getResumoLoteMedias(detalhes: ILoteDetalhes, stats: ILoteIndicadores) {
  const unidades = detalhes.unidades.length;
  const unidadesVendidas = detalhes.vendas
    .filter(venda => venda.status === 'CONCLUIDO')
    .reduce((total, venda) => total + Number(venda.quantidade_lote || 0), 0);
  return {
    compra: unidades > 0 ? stats.custoAquisicao / unidades : null,
    despesa: unidades > 0 ? stats.despesas / unidades : null,
    custo: unidades > 0 ? stats.custoTotal / unidades : null,
    venda: unidadesVendidas > 0 ? stats.vendido / unidadesVendidas : null,
    unidades,
    unidadesVendidas,
  };
}

function ResumoValor({ label, value, hint, tone = 'neutral' }: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'indigo' | 'emerald' | 'rose';
}) {
  const color = { neutral: 'text-slate-900', indigo: 'text-indigo-600', emerald: 'text-emerald-600', rose: 'text-rose-600' }[tone];
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="mt-1">
        <p className={`break-words text-lg font-black tracking-tight tabular-nums ${color}`}>{value}</p>
        {hint && <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </dd>
    </div>
  );
}

function Atalho({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
      {children}<ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

export default function LoteResumo({ detalhes, stats, onEncerrar, canClose, onNavigate }: Props) {
  const medias = getResumoLoteMedias(detalhes, stats);
  const mediaLabel = (value: number | null) => value === null ? '—' : money(value);
  const emEstoque = stats.disponiveis + stats.reservadas + stats.preparacao;

  return (
    <div className="space-y-6">
      <section aria-label="Investimento no lote" className="grid gap-5 rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Investimento total</p>
          <p className="mt-1 break-words text-2xl font-black tracking-tight tabular-nums text-slate-900">{money(stats.custoTotal)}</p>
          <p className="mt-1 text-xs text-slate-500">Compra e despesas registradas no lote</p>
        </div>
        <dl className="grid grid-cols-1 gap-5 sm:col-span-2 sm:grid-cols-2 lg:col-span-2 lg:border-l lg:border-slate-100 lg:pl-6">
          <ResumoValor label="Compra do lote" value={money(stats.custoAquisicao)} />
          <ResumoValor label="Despesas do lote" value={money(stats.despesas)} />
        </dl>
      </section>

      <section aria-label="Indicadores do lote" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LoteMetric label="Unidades em estoque" value={String(emEstoque)} tone="indigo" hint={`${stats.disponiveis} disponíveis · ${stats.reservadas} reservadas · ${stats.preparacao} em preparação`} />
        <LoteMetric label="Unidades vendidas" value={String(stats.vendidas)} hint={`De ${stats.compradas} unidades adquiridas`} />
        <LoteMetric label="Total vendido" value={money(stats.vendido)} tone="emerald" hint="Valor das vendas confirmadas" />
        <LoteMetric label="Lucro das vendidas" value={money(stats.resultado)} tone={stats.resultado < 0 ? 'rose' : 'emerald'} hint="Vendas menos o custo atualizado das unidades vendidas" />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <LoteSection title="Médias por unidade" subtitle="Compra, despesas e custo consideram todas as unidades do lote.">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
            <ResumoValor label="Compra média" value={mediaLabel(medias.compra)} />
            <ResumoValor label="Despesa média" value={mediaLabel(medias.despesa)} />
            <ResumoValor label="Custo médio atualizado" value={mediaLabel(medias.custo)} tone="indigo" />
            <ResumoValor label="Venda média" value={mediaLabel(medias.venda)} tone="emerald" hint={medias.unidadesVendidas > 0 ? `${medias.unidadesVendidas} unidades em vendas confirmadas` : 'Sem vendas confirmadas'} />
          </dl>
          <div className="border-t border-slate-100 px-5 py-2 sm:px-6">
            <p className="pt-2 text-xs leading-relaxed text-slate-500">Despesas específicas podem alterar o custo de cada unidade.</p>
            <div className="mt-1 flex flex-wrap gap-x-3">
              <Atalho onClick={() => onNavigate('entrada')}>Ver entrada e unidades</Atalho>
              <Atalho onClick={() => onNavigate('despesas')}>Ver despesas</Atalho>
            </div>
          </div>
        </LoteSection>

        <LoteSection title="Financeiro do lote" subtitle="Acompanhe os pagamentos e recebimentos efetivados.">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
            <ResumoValor label="Recebido dos clientes" value={money(stats.recebido)} />
            <ResumoValor label="Pagamentos efetuados" value={money(stats.pago)} />
            <ResumoValor label="A receber" value={money(stats.aReceber)} tone="emerald" />
            <ResumoValor label="A pagar" value={money(stats.aPagar)} />
            <ResumoValor label="Saldo de caixa" value={money(stats.saldoCaixa)} tone={stats.saldoCaixa < 0 ? 'rose' : 'indigo'} hint="Recebido menos pagamentos efetuados" />
            <ResumoValor label="Custo em estoque" value={money(stats.custoEstoque)} hint="Investimento nas unidades ainda não vendidas" />
          </dl>
          <div className="border-t border-slate-100 px-5 py-2 sm:px-6">
            <Atalho onClick={() => onNavigate('saidas')}>Ver saídas e recebimentos</Atalho>
          </div>
        </LoteSection>
      </div>

      <details className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer p-5 text-sm font-black text-slate-900 focus-visible:outline focus-visible:outline-indigo-600 sm:px-6">Evolução dos custos das vendas</summary>
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <p className="text-xs leading-relaxed text-slate-500">A referência da venda é preservada. Novas despesas podem alterar o custo e o lucro atualizado enquanto o lote estiver aberto.</p>
          <dl className="mt-4 grid gap-5 sm:grid-cols-3">
            <ResumoValor label="Custo na confirmação" value={money(stats.custoVendidoOriginal)} />
            <ResumoValor label="Custo atualizado das vendidas" value={money(stats.custoVendido)} />
            <ResumoValor label="Resultado na confirmação" value={money(stats.resultadoOriginal)} />
          </dl>
        </div>
      </details>

      <section aria-label="Encerramento do lote" className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">{detalhes.lote.encerrado ? 'Lote encerrado' : 'Encerramento do lote'}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
            {detalhes.lote.encerrado ? 'O histórico de unidades, custos e movimentações permanece disponível nas abas.' : canClose ? 'Todas as unidades foram vendidas e as contas estão quitadas. O lote pode ser encerrado.' : 'Disponível após a venda de todas as unidades e a quitação das contas do lote.'}
          </p>
        </div>
        {!detalhes.lote.encerrado && <button type="button" disabled={!canClose} onClick={() => { if (canClose) onEncerrar(); }} className={`${secondaryClass} shrink-0 disabled:cursor-not-allowed`}>Encerrar lote</button>}
      </section>
    </div>
  );
}
