import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IPedidoCompra } from '../../pedidos-compra/pedidos-compra.types';
import { LotesService } from '../lotes.service';
import { ErrorMessage, Field, fieldClass, LoteModal, money, primaryClass, secondaryClass } from './LoteUi';

export default function LotePedidoPanel({ pedido }: { pedido: IPedidoCompra }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState(50);
  const query = useQuery({ queryKey: ['lotes_pedido', pedido.id], queryFn: () => LotesService.listar(pedido.id) });
  const vehicle = pedido.veiculos?.length === 1 && pedido.veiculos[0].status === 'DISPONIVEL' ? pedido.veiculos[0] : null;
  const create = useMutation({
    mutationFn: () => LotesService.criar({ veiculoId: vehicle!.id!, quantidade, descricao: descricao.trim() }),
    onSuccess: async () => { await queryClient.invalidateQueries(); setOpen(false); },
  });
  return <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8"><div><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Gestão por lote</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Uma compra, várias unidades</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Acompanhe as unidades, os custos e os recebimentos desta compra em um único lugar.</p></div>
      {!query.isPending && !query.isError && !query.data?.length && vehicle && pedido.status === 'CONCLUIDO' && <button className={primaryClass} onClick={() => { setDescricao([vehicle.montadora?.nome, vehicle.modelo?.nome].filter(Boolean).join(' ')); create.reset(); setOpen(true); }}>Controlar como lote</button>}
    </div>
    {query.isPending && <p role="status" className="px-8 pb-6 text-sm text-slate-500">Consultando lotes do pedido…</p>}
    {query.isError && <div className="space-y-3 px-6 pb-6"><ErrorMessage error={query.error} /><button className={secondaryClass} onClick={() => query.refetch()}>Tentar novamente</button></div>}
    {!!query.data?.length && <div className="grid gap-4 px-6 pb-6 sm:px-8 sm:pb-8">{query.data.map(lote => <Link key={lote.id} to={`/lotes/${lote.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"><div><p className="font-bold text-slate-900">{lote.descricao}</p><p className="mt-1 text-sm text-slate-500">{lote.quantidade_inicial} unidades · {lote.encerrado ? 'Encerrado' : `${lote.quantidade_disponivel} disponíveis`}</p></div><span className="text-sm font-bold text-indigo-600">Abrir controle →</span></Link>)}</div>}
    {!query.isPending && !query.isError && !query.data?.length && (!vehicle || pedido.status !== 'CONCLUIDO') && <p className="px-6 pb-6 text-sm text-slate-500">O controle de lote está disponível para uma compra concluída com um único veículo representando o conjunto.</p>}
    {open && vehicle && <LoteModal title="Controlar esta compra como lote" busy={create.isPending} onClose={() => setOpen(false)}><form className="space-y-5" onSubmit={event => { event.preventDefault(); create.mutate(); }}><p className="rounded-xl bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900">A compra de <strong>{money(vehicle.valor_custo)}</strong> será distribuída entre as unidades. Os pagamentos existentes permanecem vinculados ao pedido.</p><Field label="Descrição do lote"><input className={fieldClass} required maxLength={200} value={descricao} onChange={event => setDescricao(event.target.value)} /></Field><Field label="Quantidade de unidades" hint={quantidade > 0 ? `Custo inicial por unidade: ${money(vehicle.valor_custo / quantidade)}` : undefined}><input className={fieldClass} type="number" min="2" max="1000" step="1" required value={quantidade} onChange={event => setQuantidade(Number(event.target.value))} /></Field><ErrorMessage error={create.error} /><div className="flex justify-end gap-3"><button type="button" disabled={create.isPending} className={secondaryClass} onClick={() => setOpen(false)}>Voltar</button><button disabled={create.isPending || !descricao.trim()} className={primaryClass}>{create.isPending ? 'Criando lote…' : 'Criar controle de lote'}</button></div></form></LoteModal>}
  </section>;
}
