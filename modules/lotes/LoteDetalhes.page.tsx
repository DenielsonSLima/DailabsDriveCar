import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ITitulo } from '../financeiro/financeiro.types';
import { LotesService, invalidarLotes } from './lotes.service';
import { calcularIndicadoresLote, getTituloPendente, getVendaRecebimentos } from './lotes.utils';
import type { ILoteDespesa, ILoteTransacao, ILoteUnidade, ILoteVenda } from './lotes.types';
import { LoteBaixaForm, LoteDespesaForm, LoteVendaForm, LoteIdentificacaoForm } from './components/LoteForms';
import { ErrorMessage, LoteModal, money, primaryClass, secondaryClass } from './components/LoteUi';
import LoteOperacaoForm from './components/LoteOperacaoForm';
import { getContextoTituloLote, separarContasLote } from './components/details/LoteContas';
import { LoteHistorico, LoteMovimentacoes } from './components/details/LoteMovimentacoes';
import LoteResumo from './components/details/LoteResumo';
import LoteEntrada from './components/details/LoteEntrada';
import LoteDespesas from './components/details/LoteDespesas';
import LoteSaidas from './components/details/LoteSaidas';
import type { LoteDetalhesTab } from './components/details/LoteDetailUi';

const tabs: Array<{ id: LoteDetalhesTab; label: string }> = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'entrada', label: 'Entrada' },
  { id: 'despesas', label: 'Despesas' },
  { id: 'saidas', label: 'Saídas' },
];

type OperacaoLote = { tipo: 'cancelar-despesa'; despesa: ILoteDespesa }
  | { tipo: 'estornar-baixa'; transacao: ILoteTransacao }
  | { tipo: 'devolver-venda'; venda: ILoteVenda };

export default function LoteDetalhesPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: LoteDetalhesTab = tabs.find(tab => tab.id === searchParams.get('aba'))?.id || 'resumo';
  const navigateTab = (tab: LoteDetalhesTab) => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      if (tab === 'resumo') next.delete('aba');
      else next.set('aba', tab);
      return next;
    }, { replace: true });
  };
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['lote_detalhes', id], queryFn: () => LotesService.getById(id!), enabled: !!id });
  const catalogos = useQuery({ queryKey: ['lotes_catalogos'], queryFn: () => LotesService.getCatalogos() });
  const [form, setForm] = useState<'despesa' | 'venda' | null>(null);
  const [titulo, setTitulo] = useState<ITitulo | null>(null);
  const [identificacao, setIdentificacao] = useState<ILoteUnidade | null>(null);
  const [edicaoDespesa, setEdicaoDespesa] = useState<ILoteDespesa | null>(null);
  const [operacao, setOperacao] = useState<OperacaoLote | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'cancelar'; id: string } | { type: 'encerrar' } | null>(null);
  const [notice, setNotice] = useState('');
  const detalhes = query.data;
  const refresh = async () => { await invalidarLotes(queryClient, id, detalhes?.lote.pedido_id); };
  useEffect(() => {
    if (!id) return;
    return LotesService.subscribe(id, () => { void invalidarLotes(queryClient, id); });
  }, [id, queryClient]);
  const confirmMutation = useMutation({ mutationFn: async () => { if (confirm?.type === 'cancelar') await LotesService.cancelarVenda(confirm.id); else if (confirm?.type === 'encerrar') await LotesService.encerrar(id!); }, onSuccess: async () => { const message = confirm?.type === 'cancelar' ? 'Venda cancelada e unidades devolvidas ao saldo.' : 'Lote encerrado.'; setConfirm(null); await refresh(); setNotice(message); } });
  if (query.isPending) return <div role="status" className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500">Carregando o controle do lote…</div>;
  if (!detalhes) return <div className="mx-auto max-w-xl space-y-4 p-6"><h1 className="text-xl font-black text-slate-900">Não foi possível abrir o lote</h1><ErrorMessage error={query.error || new Error('Lote não encontrado.')} /><button className={secondaryClass} onClick={() => query.refetch()}>Tentar novamente</button><Link className="ml-4 text-sm font-bold text-indigo-600" to="/pedidos-compra">Voltar às compras</Link></div>;
  const stats = calcularIndicadoresLote(detalhes);
  const lote = detalhes.lote;
  const gestaoAtualizada = detalhes.gestao_versao === 2;
  const canCreate = gestaoAtualizada && !lote.encerrado && !!catalogos.data && !catalogos.isError;
  const pendencias = detalhes.titulos.filter(item => item.status !== 'CANCELADO' && getTituloPendente(item) > 0.005);
  const canClose = !lote.encerrado && stats.disponiveis + stats.reservadas + stats.preparacao === 0 && pendencias.length === 0;
  const contas = separarContasLote(detalhes);
  const titulosAba = activeTab === 'entrada' ? contas.entrada : activeTab === 'despesas' ? contas.despesas : contas.saidas;
  const titulosAbaIds = new Set(titulosAba.map(item => item.id));
  const transacoesAba = (detalhes.transacoes || []).filter(item => titulosAbaIds.has(item.titulo_id));
  const dataMovimento = (value: string) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Maceio' });
  let minimumOperationDate: string | undefined;
  let operationDescription = '';
  if (operacao?.tipo === 'cancelar-despesa') {
    operationDescription = `${operacao.despesa.descricao} · ${money(operacao.despesa.valor_total)}. A despesa sairá do custo, mas continuará no histórico. Estorne eventuais pagamentos antes de cancelar.`;
  } else if (operacao?.tipo === 'estornar-baixa') {
    minimumOperationDate = dataMovimento(operacao.transacao.data_pagamento);
    const tituloOriginal = detalhes.titulos.find(item => item.id === operacao.transacao.titulo_id);
    const contexto = tituloOriginal ? getContextoTituloLote(tituloOriginal, detalhes.vendas, catalogos.data) : operacao.transacao.descricao || '';
    operationDescription = `${contexto}. Baixa de ${money(operacao.transacao.valor)} em ${new Date(operacao.transacao.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'America/Maceio' })} · ${operacao.transacao.conta_nome || 'Conta original'}. Será registrado um movimento inverso na mesma conta. O saldo da parcela será reaberto; o lançamento original permanecerá no histórico.`;
  } else if (operacao?.tipo === 'devolver-venda') {
    const titulosVenda = new Set(detalhes.titulos.filter(item => item.venda_pedido_id === operacao.venda.id).map(item => item.id));
    const estornadas = new Set((detalhes.transacoes || []).flatMap(item => item.estorno_de_id ? [item.estorno_de_id] : []));
    minimumOperationDate = (detalhes.transacoes || []).filter(item => titulosVenda.has(item.titulo_id) && !item.estorno_de_id && !estornadas.has(item.id))
      .map(item => dataMovimento(item.data_pagamento)).reduce((latest, date) => date > latest ? date : latest, operacao.venda.data_venda.slice(0, 10));
    operationDescription = `${operacao.venda.numero_venda} · ${operacao.venda.cliente_nome || 'Cliente da venda'}. Todas as ${operacao.venda.quantidade_lote} unidades voltarão ao estoque, as parcelas serão canceladas e ${money(getVendaRecebimentos(detalhes, operacao.venda.id).recebido)} serão devolvidos nas contas dos recebimentos originais.`;
  }
  return <div className="mx-auto max-w-screen-2xl space-y-6 px-1 pb-24 sm:px-4">
    <header className="space-y-3">
      <div className="flex flex-wrap gap-4 text-xs font-bold text-indigo-600"><Link to="/estoque?aba=lotes" className="hover:underline">← Voltar aos lotes</Link><Link to={`/pedidos-compra/${lote.pedido_id}`} className="hover:underline">Ver pedido de compra →</Link></div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 break-words text-2xl font-bold tracking-tighter text-slate-900 sm:text-3xl">{lote.descricao}</h1>
        <span className={`shrink-0 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${lote.encerrado ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>{lote.encerrado ? 'Encerrado' : 'Em andamento'}</span>
      </div>
      <p className="text-sm text-slate-500">Acompanhe a entrada, as despesas e as saídas do lote.</p>
    </header>
    {notice && <div role="status" className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p>{notice}</p><button aria-label="Dispensar mensagem" onClick={() => setNotice('')}>×</button></div>}
    {query.isRefetchError && <ErrorMessage error={query.error} />}
    {!gestaoAtualizada && <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">O controle de lotes está sendo atualizado. Novos lançamentos e correções estarão disponíveis quando a atualização terminar.</p>}
    {catalogos.isError && <div className="space-y-2"><ErrorMessage error={catalogos.error} /><button className={secondaryClass} onClick={() => catalogos.refetch()}>Recarregar opções dos formulários</button></div>}
    {catalogos.isPending && <p role="status" className="text-sm text-slate-500">Carregando opções para os lançamentos…</p>}

    <div role="group" aria-label="Seções do lote" className="grid w-full max-w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:flex sm:w-fit sm:flex-wrap">
      {tabs.map(tab => <button
        key={tab.id}
        type="button"
        aria-pressed={activeTab === tab.id}
        aria-controls="lote-section"
        onClick={() => navigateTab(tab.id)}
        className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 sm:px-6 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
      >{tab.label}</button>)}
    </div>

    <section id="lote-section" className="space-y-6" aria-label={`${tabs.find(tab => tab.id === activeTab)?.label} do lote`}>
      {activeTab === 'resumo' && <LoteResumo
        detalhes={detalhes}
        stats={stats}
        canClose={canClose}
        onNavigate={navigateTab}
        onEncerrar={() => { confirmMutation.reset(); setConfirm({ type: 'encerrar' }); }}
      />}
      {activeTab === 'entrada' && <LoteEntrada
        detalhes={detalhes}
        stats={stats}
        canCreate={canCreate}
        catalogos={catalogos.data}
        onPagar={setTitulo}
        onIdentificar={setIdentificacao}
      />}
      {activeTab === 'despesas' && <LoteDespesas
        detalhes={detalhes}
        stats={stats}
        canCreate={canCreate}
        onPagar={setTitulo}
        onAdicionar={() => setForm('despesa')}
        onEditarDespesa={setEdicaoDespesa}
        onCancelarDespesa={despesa => setOperacao({ tipo: 'cancelar-despesa', despesa })}
      />}
      {activeTab === 'saidas' && <LoteSaidas
        detalhes={detalhes}
        stats={stats}
        catalogos={catalogos.data}
        canCreate={canCreate}
        onReceber={setTitulo}
        onCancelar={vendaId => { confirmMutation.reset(); setConfirm({ type: 'cancelar', id: vendaId }); }}
        onRegistrar={() => setForm('venda')}
        onDevolver={venda => setOperacao({ tipo: 'devolver-venda', venda })}
      />}
      {activeTab === 'resumo' ? <LoteHistorico historico={detalhes.historico || []} /> : <LoteMovimentacoes
        transacoes={transacoesAba} titulos={titulosAba} vendas={detalhes.vendas}
        catalogos={catalogos.data} canOperate={gestaoAtualizada && !lote.encerrado}
        onEstornar={transacao => setOperacao({ tipo: 'estornar-baixa', transacao })}
      />}
    </section>

    {(form === 'despesa' || edicaoDespesa) && catalogos.data && <LoteDespesaForm
      catalogos={catalogos.data} unidades={detalhes.unidades} defaults={edicaoDespesa || undefined}
      onClose={() => { setForm(null); setEdicaoDespesa(null); }}
      onSave={async (data, requestId) => {
        const { motivo, ...dados } = data;
        if (edicaoDespesa) await LotesService.corrigirDespesa(edicaoDespesa.id, dados, motivo || '', requestId);
        else await LotesService.registrarDespesa(id!, dados, requestId);
        await refresh(); setNotice(edicaoDespesa ? 'Despesa corrigida. Custos atualizados e histórico preservado.' : 'Despesa registrada. Custos e contas atualizados.');
      }}
    />}
    {form === 'venda' && catalogos.data && <LoteVendaForm catalogos={catalogos.data} unidades={detalhes.unidades} onClose={() => setForm(null)} onSave={async (data, requestId) => { await LotesService.registrarVenda(id!, data, requestId); await refresh(); setNotice('Venda registrada. As unidades selecionadas e os recebimentos foram atualizados.'); }} />}
    {titulo && catalogos.data && <LoteBaixaForm titulo={titulo} contexto={getContextoTituloLote(titulo, detalhes.vendas, catalogos.data)} catalogos={catalogos.data} pendente={getTituloPendente(titulo)} onClose={() => setTitulo(null)} onSave={async data => { await LotesService.baixarTitulo(data); await refresh(); setNotice('Baixa financeira registrada.'); }} />}
    {operacao && <LoteOperacaoForm
      title={operacao.tipo === 'cancelar-despesa' ? 'Cancelar despesa' : operacao.tipo === 'estornar-baixa' ? 'Estornar baixa' : 'Devolver venda integral'}
      showDate={operacao.tipo !== 'cancelar-despesa'}
      minimumDate={minimumOperationDate}
      description={operationDescription}
      onClose={() => setOperacao(null)}
      onSave={async (motivo, data, requestId) => {
        if (operacao.tipo === 'cancelar-despesa') await LotesService.cancelarDespesa(operacao.despesa.id, motivo, requestId);
        else if (operacao.tipo === 'estornar-baixa') await LotesService.estornarBaixa(operacao.transacao.id, motivo, data, requestId);
        else await LotesService.devolverVenda(operacao.venda.id, motivo, data, requestId);
        await refresh(); setNotice('Operação concluída. Saldos atualizados e motivo registrado no histórico.');
      }}
    />}
    {identificacao && <LoteIdentificacaoForm unidade={identificacao} onClose={() => setIdentificacao(null)} onSave={async data => { await LotesService.identificarUnidade(data); await refresh(); setNotice('Identificação da unidade atualizada.'); }} />}
    {confirm && <LoteModal title={confirm.type === 'cancelar' ? 'Cancelar esta venda?' : 'Encerrar o lote?'} busy={confirmMutation.isPending} onClose={() => setConfirm(null)}><div className="space-y-5"><p className="text-sm leading-relaxed text-slate-600">{confirm.type === 'cancelar' ? 'As unidades voltarão ao saldo do lote e as contas pendentes desta venda serão canceladas. Uma venda com recebimentos precisa ser tratada pelo financeiro.' : 'Confira o resultado e os pagamentos. O encerramento exige todas as unidades vendidas e nenhuma conta em aberto.'}</p><ErrorMessage error={confirmMutation.error} /><div className="flex justify-end gap-3"><button className={secondaryClass} disabled={confirmMutation.isPending} onClick={() => setConfirm(null)}>Voltar</button><button className={primaryClass} disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>{confirmMutation.isPending ? 'Processando…' : 'Confirmar'}</button></div></div></LoteModal>}
  </div>;
}
