import React from 'react';
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import type { ILoteDetalhes, ILoteIndicadores } from '../../lotes.types';
import { money, secondaryClass } from '../LoteUi';
import { LoteMetric, LoteSection } from './LoteDetailUi';
import type { LoteDetalhesTab } from './LoteDetailUi';
import { separarContasLote, totaisContas } from './LoteContas';

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

// Apresentação do mesmo resultado gerencial já calculado pelo lote.
// O líquido desconta todas as despesas, inclusive as ainda não pagas.
export function getResumoLoteLucros(stats: ILoteIndicadores, unidadesVendidas: number) {
  const bruto = (Math.round(stats.vendido * 100) + Math.round(stats.custoAquisicaoEstoque * 100)
    - Math.round(stats.custoAquisicao * 100)) / 100;
  return { bruto, liquido: stats.resultadoComEstoque,
    medio: unidadesVendidas > 0 ? stats.resultadoComEstoque / unidadesVendidas : null };
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
      <dt className="text-xs font-semibold normal-case tracking-normal text-slate-600">{label}</dt>
      <dd className="mt-1">
        <p className={`break-words text-lg font-semibold tracking-tight tabular-nums ${color}`}>{value}</p>
        {hint && <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </dd>
    </div>
  );
}

function Atalho({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="dc-button inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
      {children}<ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

export default function LoteResumo({ detalhes, stats, onEncerrar, canClose, onNavigate }: Props) {
  const medias = getResumoLoteMedias(detalhes, stats);
  const mediaLabel = (value: number | null) => value === null ? '—' : money(value);
  const emEstoque = stats.disponiveis + stats.reservadas + stats.preparacao;
  const lucros = getResumoLoteLucros(stats, medias.unidadesVendidas);
  const contas = separarContasLote(detalhes);
  const compra = totaisContas(contas.entrada);
  const despesas = totaisContas(contas.despesas);
  const movimentos = [
    { tab: 'entrada' as const, title: 'Entrada', icon: ArrowDownLeft, value: stats.custoAquisicao, hint: `${stats.compradas} unidades adquiridas`, rows: [['Pago', compra.pago], ['A pagar', compra.pendente]] as const },
    { tab: 'despesas' as const, title: 'Despesas', icon: Receipt, value: stats.despesas, hint: 'Custos registrados no lote', rows: [['Pago', despesas.pago], ['A pagar', despesas.pendente]] as const },
    { tab: 'saidas' as const, title: 'Saídas', icon: ArrowUpRight, value: stats.vendido, hint: `${stats.vendidas} unidades vendidas`, rows: [['Recebido', stats.recebido], ['A receber', stats.aReceber]] as const },
  ];

  return (
    <div className="space-y-4">
      <section aria-label="Indicadores do lote" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LoteMetric label="Lucro médio por moto" value={mediaLabel(lucros.medio)} tone={lucros.medio !== null && lucros.medio < 0 ? 'rose' : 'indigo'} hint={medias.unidadesVendidas > 0 ? `Líquido do lote ÷ ${medias.unidadesVendidas} motos vendidas` : 'Disponível após a primeira venda confirmada'} />
        <LoteMetric label="Lucro bruto" value={money(lucros.bruto)} tone={lucros.bruto < 0 ? 'rose' : 'emerald'} hint="Vendas − aquisição das unidades vendidas" />
        <LoteMetric label="Lucro líquido do lote" value={money(lucros.liquido)} tone={lucros.liquido < 0 ? 'rose' : 'emerald'} hint="Resultado gerencial: bruto − todas as despesas do lote" />
        <LoteMetric label="Total vendido" value={money(stats.vendido)} hint={`${stats.vendidas} unidades vendidas · ${emEstoque} em estoque`} />
      </section>
      {/* Médias visíveis: apresentação dos indicadores existentes, sem novo rateio. */}
      <section aria-label="Médias do lote por unidade" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <LoteMetric label="Venda média" value={mediaLabel(medias.venda)} tone="emerald" hint={medias.unidadesVendidas > 0 ? `Vendas confirmadas ÷ ${medias.unidadesVendidas} unidades vendidas` : 'Sem vendas confirmadas para calcular a média'} />
        <LoteMetric label="Despesa média" value={mediaLabel(medias.despesa)} hint={medias.unidades > 0 ? `Todas as despesas ÷ ${medias.unidades} unidades do lote` : 'Sem unidades no lote para calcular a média'} />
        <LoteMetric label="Compra média incluindo despesas" value={mediaLabel(medias.custo)} tone="indigo" hint={medias.unidades > 0 ? `(Compra + despesas) ÷ ${medias.unidades} unidades do lote; despesa média já incluída` : 'Sem unidades no lote para calcular a média'} />
      </section>
      <div className="dc-panel space-y-2 text-sm text-slate-600">
        <h2 className="dc-section-title">Como interpretar as médias e o lucro</h2>
        <p>Para a despesa média e a compra média incluindo despesas, o total de despesas é dividido por todas as unidades do lote, vendidas ou em estoque. A compra média incluindo despesas já contém a despesa média: não some novamente. Despesas específicas podem alterar o custo de cada unidade.</p>
        <p>O resultado gerencial deduz todas as despesas lançadas do lote. O lucro médio divide esse resultado apenas pelas unidades vendidas. Por isso, com poucas vendas, o lucro médio pode ficar menor; isso não significa que as despesas foram rateadas somente nas unidades vendidas.</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span><strong className="font-semibold text-slate-900">{emEstoque}</strong> unidades em estoque</span>
        <span><strong className="font-semibold text-emerald-700">{stats.disponiveis}</strong> disponíveis</span>
        <span>{stats.reservadas} reservadas</span><span>{stats.preparacao} em preparação</span>
        <span className="sm:ml-auto">{stats.vendidas} de {stats.compradas} vendidas</span>
      </div>
      <section aria-label="Movimentação do lote" className="grid gap-3 lg:grid-cols-3">
        {movimentos.map(item => <button key={item.tab} type="button" onClick={() => onNavigate(item.tab)} className="dc-button group min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><item.icon size={16} className="text-slate-600" aria-hidden="true" />{item.title}</span><ArrowRight size={15} className="text-slate-600 group-hover:text-indigo-600" aria-hidden="true" /></span>
          <span className="mt-2 block break-words text-xl font-semibold tabular-nums text-slate-900">{money(item.value)}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
          <span className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">{item.rows.map(([label, value]) => <span key={label} className="min-w-0"><span className="block text-xs text-slate-500">{label}</span><span className="mt-1 block break-words text-sm font-medium tabular-nums text-slate-700">{money(value)}</span></span>)}</span>
        </button>)}
      </section>
      <p className="text-xs leading-relaxed text-slate-500">O lucro considera vendas confirmadas e custos lançados. Recebimentos e pagamentos são apresentados separadamente; não equivalem ao lucro.</p>

      <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer p-4 text-sm font-semibold text-slate-900">Detalhamento do resultado e médias por unidade</summary>
      <div className="grid items-start gap-4 border-t border-slate-100 p-4 xl:grid-cols-2">
        <LoteSection title="Médias por unidade" subtitle="Compra, despesas e custo consideram todas as unidades do lote.">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 p-4 sm:grid-cols-2">
            <ResumoValor label="Compra média" value={mediaLabel(medias.compra)} hint={`Aquisição total: ${money(stats.custoAquisicao)}`} />
            <ResumoValor label="Despesa média" value={mediaLabel(medias.despesa)} hint={`Despesas totais: ${money(stats.despesas)}`} />
            <ResumoValor label="Custo médio atualizado" value={mediaLabel(medias.custo)} tone="indigo" hint={`Custo total: ${money(stats.custoTotal)}`} />
            <ResumoValor label="Venda média" value={mediaLabel(medias.venda)} tone="emerald" hint={medias.unidadesVendidas > 0 ? `${medias.unidadesVendidas} unidades em vendas confirmadas` : 'Sem vendas confirmadas'} />
          </dl>
          <div className="border-t border-slate-100 px-4 py-2">
            <p className="pt-2 text-xs leading-relaxed text-slate-500">Despesas específicas podem alterar o custo de cada unidade.</p>
            <div className="mt-1 flex flex-wrap gap-x-3">
              <Atalho onClick={() => onNavigate('entrada')}>Ver entrada e unidades</Atalho>
              <Atalho onClick={() => onNavigate('despesas')}>Ver despesas</Atalho>
            </div>
          </div>
        </LoteSection>

        <LoteSection title="Resultado do lote" subtitle="O estoque mantém o valor de compra. As despesas lançadas reduzem o resultado, mesmo antes das vendas.">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 p-4 sm:grid-cols-2">
            <ResumoValor label="Vendas confirmadas (+)" value={money(stats.vendido)} hint="Inclui valores recebidos e a receber das vendas" />
            <ResumoValor label="Estoque a custo de compra (+)" value={money(stats.custoAquisicaoEstoque)} hint="Unidades ainda não vendidas, sem somar despesas" />
            <ResumoValor label="Compra total do lote (−)" value={money(stats.custoAquisicao)} />
            <ResumoValor label="Despesas lançadas (−)" value={money(stats.despesas)} hint="Pagas e a pagar, descontadas uma única vez" />
            <ResumoValor label="Resultado com estoque" value={money(stats.resultadoComEstoque)} tone={stats.resultadoComEstoque < 0 ? 'rose' : 'emerald'} hint="Vendas + estoque a custo de compra − compra total − despesas" />
          </dl>
          <div className="border-t border-slate-100 px-4 py-2">
            <p className="pt-2 text-xs leading-relaxed text-slate-500">Resultado gerencial do lote, não saldo bancário. Sem vendas, a compra permanece em estoque e somente as despesas reduzem este resultado.</p>
            <Atalho onClick={() => onNavigate('saidas')}>Ver saídas e recebimentos</Atalho>
          </div>
        </LoteSection>
      </div>

      </details>

      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer p-4 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-indigo-600">Caixa e contas do lote</summary>
        <div className="border-t border-slate-100 p-4">
          <p className="text-xs leading-relaxed text-slate-500">O fluxo de caixa mostra somente o dinheiro recebido e pago. A saída para comprar estoque não representa, por si só, prejuízo.</p>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <ResumoValor label="Recebido dos clientes" value={money(stats.recebido)} />
            <ResumoValor label="Pagamentos efetuados" value={money(stats.pago)} />
            <ResumoValor label="Fluxo de caixa do lote" value={money(stats.saldoCaixa)} hint="Recebido menos pagamentos; não inclui estoque nem contas em aberto" />
            <ResumoValor label="A receber" value={money(stats.aReceber)} tone="emerald" />
            <ResumoValor label="A pagar" value={money(stats.aPagar)} />
            <ResumoValor label="Custo atualizado em estoque" value={money(stats.custoEstoque)} hint="Compra e despesas alocadas nas unidades ainda não vendidas" />
          </dl>
        </div>
      </details>

      <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="cursor-pointer p-4 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-indigo-600">Evolução dos custos das vendas</summary>
        <div className="border-t border-slate-100 p-4">
          <p className="text-xs leading-relaxed text-slate-500">A referência da venda é preservada. Novas despesas podem alterar o custo e o lucro atualizado enquanto o lote estiver aberto.</p>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <ResumoValor label="Custo na confirmação" value={money(stats.custoVendidoOriginal)} />
            <ResumoValor label="Custo atualizado das vendidas" value={money(stats.custoVendido)} />
            <ResumoValor label="Resultado na confirmação" value={money(stats.resultadoOriginal)} />
            <ResumoValor label="Lucro atualizado das vendidas" value={money(stats.resultado)} hint="Vendas menos o custo atualizado apenas das unidades vendidas" />
          </dl>
        </div>
      </details>

      <section aria-label="Encerramento do lote" className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="dc-section-title text-sm font-semibold normal-case tracking-tight text-slate-900">{detalhes.lote.encerrado ? 'Lote encerrado' : 'Encerramento do lote'}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
            {detalhes.lote.encerrado ? 'O histórico de unidades, custos e movimentações permanece disponível nas abas.' : canClose ? 'Todas as unidades foram vendidas e as contas estão quitadas. O lote pode ser encerrado.' : 'Disponível após a venda de todas as unidades e a quitação das contas do lote.'}
          </p>
        </div>
        {!detalhes.lote.encerrado && <button type="button" disabled={!canClose} onClick={() => { if (canClose) onEncerrar(); }} className={`dc-button ${secondaryClass} shrink-0 disabled:cursor-not-allowed`}>Encerrar lote</button>}
      </section>
    </div>
  );
}
