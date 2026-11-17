import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ILoteDetalhes } from '../../lotes.types';
import { getRecebiveisLote, getVendasRecebiveisLote, type LoteFinanceiroFiltro } from '../../lotes.financeiro';
import { LoteFinanceiroService } from '../../lotes.financeiro.service';
import { acknowledgeTituloRefresh, awaitTituloRefresh, useTituloPaymentState } from '../../../financeiro/submodules/components/tituloPaymentState';
import ModalBaixa from '../../../financeiro/submodules/components/ModalBaixa';
import LoteRecebimentoHistorico from './LoteRecebimentoHistorico';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('recebimento');
  const vendaId = searchParams.get('vendaFinanceiro');
  const abrirVenda = (id: string | null) => setSearchParams(current => {
    const next = new URLSearchParams(current);
    next.set('aba', 'financeiro');
    if (id) next.set('vendaFinanceiro', id); else next.delete('vendaFinanceiro');
    next.delete('recebimento'); next.delete('acao');
    return next;
  });
  const baixaAberta = searchParams.get('acao') === 'baixar';
  const navigate = (id: string | null, baixa = false, replace = false) => setSearchParams(current => {
    const next = new URLSearchParams(current);
    next.set('aba', 'financeiro');
    if (id) next.set('recebimento', id); else next.delete('recebimento');
    if (id && baixa) next.set('acao', 'baixar'); else next.delete('acao');
    return next;
  }, { replace });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const vendaHeadingRef = useRef<HTMLHeadingElement>(null);
  const vendaCardsRef = useRef(new Map<string, HTMLButtonElement>());
  const ultimaVendaRef = useRef<string | null>(null);
  const cardsRef = useRef(new Map<string, HTMLButtonElement>());
  const lastSelected = useRef<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const paymentState = useTituloPaymentState(selectedId);
  const mountedRef = useRef(false);
  const currentRoute = useRef({ selectedId, baixaAberta, loteId: detalhes.lote.id });
  useLayoutEffect(() => { currentRoute.current = { selectedId, baixaAberta, loteId: detalhes.lote.id }; });
  useLayoutEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const selecionado = getRecebiveisLote(detalhes, 'TODOS').find(item => item.titulo.id === selectedId);
  const vendas = useMemo(() => getVendasRecebiveisLote(detalhes, filtro), [detalhes, filtro]);
  const vendaAberta = getVendasRecebiveisLote(detalhes, 'TODOS').find(item => item.id === vendaId);
  const motoAberta = detalhes.unidades.find(unidade => unidade.id === vendaAberta?.veiculoId);
  const identificacaoAberta = vendaAberta?.compartilhada ? 'Parcelas compartilhadas' : (motoAberta?.placa || motoAberta?.chassi || (motoAberta ? `Moto ${motoAberta.lote_ordem}` : 'Moto da venda'));
  const parcelasVisiveis = vendaAberta?.parcelas || [];
  const totalPaginas = Math.max(1, Math.ceil(vendas.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const historico = useQuery({
    queryKey: ['lote-recebimento', detalhes.lote.organization_id, detalhes.lote.id, selecionado?.titulo.id],
    queryFn: () => LoteFinanceiroService.getRecebimento(detalhes.lote.id, selecionado!.titulo.id),
    enabled: !!selecionado,
    staleTime: 0,
  });
  useEffect(() => {
    if (selectedId) { lastSelected.current = selectedId; if (!baixaAberta) headingRef.current?.focus(); }
    else if (lastSelected.current) cardsRef.current.get(lastSelected.current)?.focus();
  }, [selectedId, baixaAberta]);
  useEffect(() => {
    if (selectedId && !selecionado) navigate(null, false, true);
  }, [selectedId, selecionado]);
  useEffect(() => {
    if (selecionado) acknowledgeTituloRefresh(selecionado.titulo);
  }, [selecionado?.titulo, paymentState.refreshSnapshot]);
  useEffect(() => {
    if (vendaId && !selectedId) { ultimaVendaRef.current = vendaId; vendaHeadingRef.current?.focus(); }
    else if (!vendaId && !selectedId && ultimaVendaRef.current) vendaCardsRef.current.get(ultimaVendaRef.current)?.focus();
  }, [vendaId, selectedId]);
  const voltar = () => abrirVenda(getVendasRecebiveisLote(detalhes, 'TODOS').find(grupo => grupo.parcelas.some(item => item.titulo.id === selectedId))?.id || vendaId);
  useEffect(() => { if (vendaId && !vendaAberta && !selectedId) abrirVenda(null); }, [vendaId, vendaAberta, selectedId]);
  const recarregar = async () => {
    if (mountedRef.current) { setRefreshing(true); setRefreshError(false); }
    try {
      await queryClient.invalidateQueries({ queryKey: ['lote-recebimento'] });
      await onUpdated();
    } catch { if (mountedRef.current) setRefreshError(true); } finally { if (mountedRef.current) setRefreshing(false); }
  };
  const atualizar = async () => {
    if (selecionado) awaitTituloRefresh(selecionado.titulo);
    // A completion from an unmounted form must not restore its old route/selection.
    if (mountedRef.current && currentRoute.current.loteId === detalhes.lote.id && currentRoute.current.selectedId === selectedId && currentRoute.current.baixaAberta) {
      navigate(selectedId, false, true);
    }
    await recarregar();
  };
  const aguardaAtualizacao = refreshing || !!paymentState.refreshSnapshot;

  return (
    <section className="space-y-3" aria-label="Financeiro do lote">
      {selecionado ? <>
        <nav aria-label="Caminho do recebimento" className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span title={detalhes.lote.descricao} className="max-w-48 truncate">{detalhes.lote.descricao}</span><span aria-hidden="true">/</span>
          <button type="button" onClick={voltar} className="dc-button font-semibold text-indigo-600 hover:underline">Financeiro</button><span aria-hidden="true">/</span>
          <span aria-current="page">Venda #{selecionado.venda.numero_venda} · Parcela {selecionado.titulo.parcela_numero || 1}</span>
        </nav>
        <div className="dc-panel rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-3 items-center">
            <div className="min-w-0"><h3 ref={headingRef} tabIndex={-1} className="dc-section-title text-base font-semibold text-slate-900 break-words">{selecionado.venda.cliente_nome || selecionado.titulo.parceiro?.nome || 'Cliente não informado'}</h3><p className="text-xs text-slate-500 break-words">{selecionado.titulo.descricao}</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={voltar} className={secondaryClass}>Voltar às parcelas</button>
              {selecionado.pendente > 0 && !baixaAberta && <button type="button" disabled={!canCreate || aguardaAtualizacao || paymentState.pending} className="dc-button rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-white font-semibold disabled:opacity-50" onClick={() => navigate(selectedId, true)}>Baixar título</button>}
            </div>
          </div>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div><dt className="text-slate-500">Vencimento</dt><dd className="font-semibold text-slate-900">{dateLabel(selecionado.titulo.data_vencimento)}</dd></div>
            <div><dt className="text-slate-500">Valor original</dt><dd className="font-semibold text-slate-900">{money(selecionado.titulo.valor_total)}</dd></div>
            <div><dt className="text-slate-500">Recebido</dt><dd className="font-semibold text-emerald-700">{money(selecionado.titulo.valor_pago)}</dd></div>
            <div><dt className="text-slate-500">Em aberto</dt><dd className="font-semibold text-amber-700">{money(selecionado.pendente)}</dd></div>
          </dl>
          {(selecionado.titulo.documento_ref || historico.data?.documento_ref || historico.data?.parceiro?.documento) && <details className="rounded-lg border border-slate-200 p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-slate-700">Dados do título</summary>
            <dl className="mt-3 space-y-2 text-slate-600">
              {(selecionado.titulo.documento_ref || historico.data?.documento_ref) && <div><dt>Referência</dt><dd className="break-words">{selecionado.titulo.documento_ref || historico.data?.documento_ref}</dd></div>}
              {historico.data?.parceiro?.documento && <div><dt>Documento do cliente</dt><dd>{historico.data.parceiro.documento}</dd></div>}
            </dl>
          </details>}
          {paymentState.pending && <p role="status" className="text-xs text-slate-600">Recebimento em processamento. Você pode navegar; este título ficará bloqueado até a conclusão.</p>}
          {(aguardaAtualizacao || refreshError) && <p role="status" className="text-xs text-slate-600">Recebimento registrado. {refreshing ? 'Atualizando saldo...' : <>Atualize o saldo antes de registrar outro recebimento. <button type="button" className="dc-button underline" onClick={() => void recarregar()}>Atualizar saldo</button></>}</p>}
          {historico.isPending && <p role="status" className="text-xs text-slate-500">Carregando histórico...</p>}
          {historico.isError && <div role="alert" className="text-xs text-rose-700">Não foi possível carregar o histórico. <button type="button" className="dc-button underline" onClick={() => historico.refetch()}>Tentar novamente</button></div>}
        </div>
        {baixaAberta && canCreate && !aguardaAtualizacao && selecionado.pendente > 0 && <ModalBaixa key={selecionado.titulo.id} presentation="inline" titulo={selecionado.titulo} onClose={() => navigate(selectedId, false, true)} onSuccess={atualizar} />}
        {historico.data && !historico.isError && <LoteRecebimentoHistorico titulo={historico.data} />}
      </> : <>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 ref={vendaHeadingRef} tabIndex={-1} className="dc-section-title text-base font-semibold text-slate-900">{vendaAberta ? `Venda #${vendaAberta.venda.numero_venda} · ${identificacaoAberta} · Parcelas` : 'Financeiro'}</h3><p className="text-xs text-slate-500">{vendaAberta ? (vendaAberta.venda.cliente_nome || 'Cliente não informado') : 'Uma moto por card. Abra para consultar suas parcelas.'}</p></div>
          {vendaAberta ? <button type="button" onClick={() => abrirVenda(null)} className={secondaryClass}>Voltar às motos</button> : <div className="flex flex-wrap gap-1" aria-label="Situação dos recebimentos">{filtros.map(([valor, label]) => <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => { setFiltro(valor); setPagina(1); }} className={`dc-button rounded-lg px-3 py-2 text-xs font-semibold ${filtro === valor ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>)}</div>}
        </div>
        {!vendaAberta && (vendas.length === 0 ? <LoteEmpty>{filtro === 'EM_ABERTO' ? 'Nenhum recebimento em aberto neste lote.' : 'Nenhuma venda nesta situação.'}</LoteEmpty> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {vendas.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE).map(grupo => {
            const unidades = detalhes.unidades.filter(unidade => (grupo.veiculoId ? unidade.id === grupo.veiculoId : grupo.venda.itens?.some(item => item.veiculo_id === unidade.id)));
            const identificacao = unidades.map(unidade => unidade.placa || unidade.chassi || `Moto ${unidade.lote_ordem}`).join(' · ');
            const proxima = grupo.parcelas.find(item => item.pendente > 0);
            return <button key={grupo.id} ref={element => { if (element) vendaCardsRef.current.set(grupo.id, element); else vendaCardsRef.current.delete(grupo.id); }} type="button" onClick={() => abrirVenda(grupo.id)} className="dc-button min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left space-y-2 hover:border-indigo-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
              <span className="block font-semibold text-sm text-slate-900">{grupo.venda.cliente_nome || grupo.parcelas[0]?.titulo.parceiro?.nome || 'Cliente não informado'}</span>
              <span className="block text-xs text-slate-500">Venda #{grupo.venda.numero_venda} · {grupo.compartilhada ? `${grupo.venda.quantidade_lote} motos · parcelas compartilhadas` : '1 moto'}</span>
              {identificacao && <span className="block truncate text-xs text-slate-600" title={identificacao}>{identificacao}</span>}
              <span className="block text-xs text-slate-500">{grupo.parcelas.filter(item => item.pendente === 0).length}/{grupo.parcelas.length} parcelas quitadas · Recebido {money(grupo.recebido)}</span>
              <span className="flex justify-between gap-2 text-xs"><span>{grupo.pendente > 0 ? 'Em aberto' : 'Quitado'}</span><strong>{money(grupo.pendente)}</strong></span>
              {proxima && <span className="block text-xs text-slate-500">Próximo vencimento: {dateLabel(proxima.titulo.data_vencimento)}</span>}
              <span className="block text-xs font-semibold text-indigo-600">Ver parcelas →</span>
            </button>;
          })}
        </div>)}
        {vendaAberta && vendaAberta.compartilhada && <p className="text-xs text-slate-500">Venda com {vendaAberta.venda.quantidade_lote} motos. As parcelas são compartilhadas pela venda, sem duplicação de valores. {detalhes.unidades.filter(unidade => vendaAberta.venda.itens?.some(item => item.veiculo_id === unidade.id)).map(unidade => unidade.placa || unidade.chassi || `Moto ${unidade.lote_ordem}`).join(' · ')}</p>}
        {vendaAberta && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {parcelasVisiveis.map(({ titulo, venda, pendente }) => <button key={titulo.id} ref={element => { if (element) cardsRef.current.set(titulo.id, element); else cardsRef.current.delete(titulo.id); }} type="button" onClick={() => navigate(titulo.id)} className="dc-button min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left space-y-2 hover:border-indigo-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
            <span className="flex min-w-0 items-center justify-between gap-2 text-xs"><span className="truncate font-semibold text-slate-900" title={venda.cliente_nome || titulo.parceiro?.nome}>{venda.cliente_nome || titulo.parceiro?.nome || 'Cliente não informado'}</span><span className={`shrink-0 text-xs font-semibold ${pendente > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{pendente > 0 ? 'Em aberto' : 'Quitado'}</span></span>
            <span className="block truncate text-xs text-slate-500">Venda #{venda.numero_venda} · Parcela {titulo.parcela_numero || 1}/{titulo.parcela_total || 1}</span>
            <span className="block truncate text-xs text-slate-500">Vence {dateLabel(titulo.data_vencimento)} · Recebido {money(titulo.valor_pago)}</span>
            <span className="flex items-center justify-between gap-2 text-xs"><span className="text-slate-500">Em aberto</span><span className="font-semibold tabular-nums text-slate-900">{money(pendente)}</span></span>
          </button>)}
        </div>}
        {!vendaAberta && totalPaginas > 1 && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Página {paginaAtual} de {totalPaginas} · {vendas.length} grupos</span><div className="flex gap-2"><button type="button" className={secondaryClass} disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button><button type="button" className={secondaryClass} disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button></div></div>}
      </>}
    </section>
  );
}
