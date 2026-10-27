import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes, ChevronRight } from 'lucide-react';
import type { ILoteResumo } from './lotes.types';

export default function EstoqueLotes({ lots }: { lots: ILoteResumo[] }) {
  if (!lots?.length) return (
    <div className="text-center py-20 px-6 bg-white rounded-[2.5rem] border border-slate-200 border-dashed">
      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum lote encontrado para os filtros atuais.</p>
    </div>
  );

  return (
    <section aria-label="Lotes em estoque" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
      {lots.map(lot => (
        <Link
          key={lot.id}
          to={`/lotes/${lot.id}`}
          className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 flex flex-col h-full motion-safe:hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
        >
          <div className="aspect-[4/3] bg-slate-100 relative flex items-center justify-center shrink-0">
            <Boxes size={48} strokeWidth={1} aria-hidden="true" className="text-slate-300" />
            <span className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${lot.encerrado ? 'bg-slate-400 shadow-slate-200' : 'bg-emerald-500 shadow-emerald-200'}`}>
              {lot.encerrado ? 'Encerrado' : 'Ativo'}
            </span>
            <span className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded-md border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm uppercase">
              Estoque em lote
            </span>
          </div>

          <div className="p-5 flex flex-col flex-1">
            <div className="mb-4">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{lot.quantidade_inicial} unidades adquiridas</p>
              <h3 className="font-black text-slate-900 text-lg leading-tight line-clamp-2 uppercase tracking-tighter" title={lot.descricao}>{lot.descricao}</h3>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Disponíveis</p>
                <p className="text-xl font-black text-emerald-600 tracking-tight">{lot.quantidade_disponivel}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Vendidas</p>
                <p className="text-xl font-black text-slate-700 tracking-tight">{lot.quantidade_vendida}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Ver detalhes do lote</span>
              <span className="w-8 h-8 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}
