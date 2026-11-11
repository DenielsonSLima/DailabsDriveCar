import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ILoteDetalhes } from '../../lotes.types';
import { getRecebiveisLote, type LoteFinanceiroFiltro } from '../../lotes.financeiro';
import { LoteFinanceiroService } from '../../lotes.financeiro.service';
import ModalBaixa from '../../../financeiro/submodules/components/ModalBaixa';
import ReceberQuickView from '../../../financeiro/submodules/contas-receber/components/ReceberQuickView';
import { dateLabel, money, secondaryClass } from '../LoteUi';
import { LoteEmpty } from './LoteDetailUi';

interface Props {
  detalhes: ILoteDetalhes;
  canCreate: boolean;
  onUpdated: () => void | Promise<void>;
}

const PAGE_SIZE = 12;
const filtros: Array<[LoteFinanceiroFiltro, string]> = [['EM_ABERTO', 'Em aberto'], ['QUITADOS', 'Quitados'], ['TODOS', 'Todos']];

export default function LoteFinanceiro({ detalhes, canCreate, onUpdated }: Props) {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<LoteFinanceiroFiltro>('EM_ABERTO');
  const [pagina, setPagina] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef(new Map<string, HTMLButtonElement>());
  const lastSelected = useRef<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [paidSnapshot, setPaidSnapshot] = useState<ILoteDetalhes['titulos'][number] | null>(null);
  const [modal, setModal] = useState<'baixa' | 'historico' | null>(null);
  const recebiveis = useMemo(() => getRecebiveisLote(detalhes, filtro), [detalhes, filtro]);
  const selecionado = getRecebiveisLote(detalhes, 'TODOS').find(item => item.titulo.id === selectedId);
  const totalPaginas = Math.max(1, Math.ceil(recebiveis.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const historico = useQuery({
    queryKey: ['lote-recebimento', detalhes.lote.organization_id, detalhes.lote.id, selecionado?.titulo.id],
    queryFn: () => LoteFinanceiroService.getRecebimento(detalhes.lote.id, selecionado!.titulo.id),
    enabled: modal === 'historico' && !!selecionado,
    staleTime: 0,
  });
  useEffect(() => {
    if (selectedId) { lastSelected.current = selectedId; if (!modal) headingRef.current?.focus(); }
    else if (lastSelected.current) cardsRef.current.get(lastSelected.current)?.focus();
  }, [selectedId, modal]);
  useEffect(() => {
    if (selectedId && !selecionado) { setSelectedId(null); setModal(null); }
  }, [selectedId, selecionado]);
  const voltar = () => { setSelectedId(null); setModal(null); };
  const recarregar = async () => {
    setRefreshing(true); setRefreshError(false);
    try {
      await queryClient.invalidateQueries({ queryKey: ['lote-recebimento'] });
      await onUpdated();
    } catch { setRefreshError(true); } finally { setRefreshing(false); }
  };
  const atualizar = () => {
    setModal(null);
    setPaidSnapshot(selecionado?.titulo || null);
    void recarregar();
  };
  const aguardaAtualizacao = refreshing || (!!paidSnapshot && paidSnapshot === selecionado?.titulo);

  return (
    <section className="space-y-3" aria-label="Financeiro do lote">
      {selecionado ? <>
        <nav aria-label="Caminho do recebimento" className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span title={detalhes.lote.descricao} className="max-w-48 truncate">{detalhes.lote.descricao}</span><span aria-hidden="true">/</span>
          <button type="button" onClick={voltar} className="font-semibold text-indigo-600 hover:underline">Financeiro</button><span aria-hidden="true">/</span>
          <span aria-current="page">Venda #{selecionado.venda.numero_venda} · Parcela {selecionado.titulo.parcela_numero || 1}</span>
        </nav>
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-3 items-center">
            <div className="min-w-0"><h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-slate-900 break-words">{selecionado.venda.cliente_nome || selecionado.titulo.parceiro?.nome || 'Cliente não informado'}</h3><p className="text-xs text-slate-500 break-words">{selecionado.titulo.descricao}</p></div>
            <button type="button" onClick={voltar} className={secondaryClass}>Voltar ao financeiro</button>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div><dt className="text-slate-500">Vencimento</dt><dd className="font-semibold text-slate-900">{dateLabel(selecionado.titulo.data_vencimento)}</dd></div>
            <div><dt className="text-slate-500">Valor original</dt><dd className="font-semibold text-slate-900">{money(selecionado.titulo.valor_total)}</dd></div>
            <div><dt className="text-slate-500">Recebido</dt><dd className="font-semibold text-emerald-700">{money(selecionado.titulo.valor_pago)}</dd></div>
            <div><dt className="text-slate-500">Em aberto</dt><dd className="font-semibold text-amber-700">{money(selecionado.pendente)}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {selecionado.pendente > 0 && <button type="button" disabled={!canCreate || aguardaAtualizacao} className={secondaryClass} onClick={() => setModal('baixa')}>Registrar recebimento / juros</button>}
            <button type="button" className={secondaryClass} disabled={modal === 'historico' && historico.isFetching} onClick={() => setModal('historico')}>Histórico de recebimentos</button>
          </div>
          {(aguardaAtualizacao || refreshError) && <p role="status" className="text-xs text-slate-600">Recebimento registrado. {refreshing ? 'Atualizando saldo...' : <>Atualize o saldo antes de registrar outro recebimento. <button type="button" className="underline" onClick={() => void recarregar()}>Atualizar saldo</button></>}</p>}
          {modal === 'historico' && historico.isFetching && <p role="status" className="text-xs text-slate-500">Carregando histórico...</p>}
          {modal === 'historico' && historico.isError && <div role="alert" className="text-xs text-rose-700">Não foi possível carregar o histórico. <button type="button" className="underline" onClick={() => historico.refetch()}>Tentar novamente</button></div>}
        </div>
      </> : <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="text-base font-semibold text-slate-900">Financeiro</h3><p className="text-xs text-slate-500">Recebimentos das vendas confirmadas deste lote.</p></div>
          <div className="flex flex-wrap gap-1" aria-label="Situação dos recebimentos">{filtros.map(([valor, label]) => <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => { setFiltro(valor); setPagina(1); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filtro === valor ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>)}</div>
        </div>
        {recebiveis.length === 0 ? <LoteEmpty>{filtro === 'EM_ABERTO' ? 'Nenhum recebimento em aberto neste lote.' : 'Nenhum recebimento nesta situação.'}</LoteEmpty> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {recebiveis.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE).map(({ titulo, venda, pendente }) => <button key={titulo.id} ref={element => { if (element) cardsRef.current.set(titulo.id, element); else cardsRef.current.delete(titulo.id); }} type="button" onClick={() => { setSelectedId(titulo.id); setModal(null); }} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left space-y-2 hover:border-indigo-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
            <span className="flex min-w-0 items-center justify-between gap-2 text-xs"><span className="truncate font-semibold text-slate-900" title={venda.cliente_nome || titulo.parceiro?.nome}>{venda.cliente_nome || titulo.parceiro?.nome || 'Cliente não informado'}</span><span className={`shrink-0 text-[10px] font-semibold ${pendente > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{pendente > 0 ? 'Em aberto' : 'Quitado'}</span></span>
            <span className="block truncate text-xs text-slate-500">Venda #{venda.numero_venda} · Parcela {titulo.parcela_numero || 1}/{titulo.parcela_total || 1}</span>
            <span className="block truncate text-xs text-slate-500">Vence {dateLabel(titulo.data_vencimento)} · Recebido {money(titulo.valor_pago)}</span>
            <span className="flex items-center justify-between gap-2 text-xs"><span className="text-slate-500">Em aberto</span><span className="font-semibold tabular-nums text-slate-900">{money(pendente)}</span></span>
          </button>)}
        </div>}
        {totalPaginas > 1 && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Página {paginaAtual} de {totalPaginas} · {recebiveis.length} recebimentos</span><div className="flex gap-2"><button type="button" className={secondaryClass} disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button><button type="button" className={secondaryClass} disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button></div></div>}
      </>}
      {selecionado && modal === 'baixa' && canCreate && <ModalBaixa key={selecionado.titulo.id} titulo={selecionado.titulo} onClose={() => setModal(null)} onSuccess={atualizar} />}
      {selecionado && modal === 'historico' && historico.data && !historico.isFetching && !historico.isError && <ReceberQuickView titulo={historico.data} isOpen readOnly onClose={() => setModal(null)} />}
    </section>
  );
}
