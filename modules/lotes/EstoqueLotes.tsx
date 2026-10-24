import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes, ArrowUpRight } from 'lucide-react';
import type { ILoteResumo } from './lotes.types';

export default function EstoqueLotes({ lots }: { lots: ILoteResumo[] }) {
  if (!lots?.length) return null;
  return <section aria-label="Lotes em estoque" className="space-y-4">
    <div className="flex items-center gap-2"><Boxes size={20} className="text-indigo-600" />
      <h2 className="text-lg font-black text-slate-900">Lotes de veículos</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lots.map(lot => <Link key={lot.id} to={`/lotes/${lot.id}`}
      className="group rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
      <div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">Estoque em lote</span>
        <ArrowUpRight size={20} className="text-slate-400 group-hover:text-indigo-600" /></div>
      <h3 className="mt-5 text-lg font-black text-slate-900">{lot.descricao}</h3>
      <p className="mt-1 text-sm text-slate-500">{lot.quantidade_inicial} unidades adquiridas</p>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div><strong className="block text-2xl text-emerald-600">{lot.quantidade_disponivel}</strong><span className="text-xs font-semibold text-slate-500">Disponíveis</span></div>
        <div><strong className="block text-2xl text-slate-900">{lot.quantidade_vendida}</strong><span className="text-xs font-semibold text-slate-500">Vendidas</span></div>
      </div>
      <p className="mt-5 text-xs font-bold text-indigo-600">Ver despesas, vendas e recebimentos →</p>
    </Link>)}</div>
  </section>;
}
