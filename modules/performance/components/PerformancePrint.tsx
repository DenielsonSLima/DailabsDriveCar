import React from 'react';
import { IPerformanceData } from '../performance.types';
import {
  VendasTable,
  ComprasTable,
  TitulosTable,
  DespesasTable,
  RetiradasTable,
  EstoqueTable
} from './tables/PerformanceTables';

interface Props {
  data: IPerformanceData;
  empresa: any;
  watermark: any;
  periodo: string;
}

const PerformancePrint: React.FC<Props> = ({ data, empresa, watermark, periodo }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const now = new Date();
  const r = data.resumo;

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 relative p-12 mx-auto print-container font-sans" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>

      {/* MARCA D'ÁGUA */}
      {watermark?.logo_url && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img
            src={watermark.logo_url}
            style={{
              opacity: (watermark.opacidade || 20) / 200,
              transform: `scale(${(watermark.tamanho || 50) / 100})`,
              maxWidth: '60%',
              maxHeight: '60%',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact' as any,
            }}
            alt=""
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col">

        {/* ═══════════ CABEÇALHO DA EMPRESA ═══════════ */}
        <header className="flex items-center justify-between border-b-[3px] border-slate-900 pb-8 mb-10">
          <div className="flex items-center space-x-8">
            {empresa?.logo_url && (
              <img src={empresa.logo_url} alt="Logo" className="h-28 w-auto object-contain max-w-[200px]" />
            )}
            <div>
              <h1 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter leading-none mb-1">{empresa?.nome_fantasia || 'NOME DA EMPRESA'}</h1>
              <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>{empresa?.razao_social}</span>
                <span className="w-1 h-3 border-l border-slate-300"></span>
                <span>CNPJ: {empresa?.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') || '—'}</span>
              </div>
              <div className="mt-2 text-[9px] font-medium text-slate-400 uppercase tracking-wide leading-snug">
                <p>{empresa?.logradouro}, {empresa?.numero} - {empresa?.bairro} • {empresa?.cidade}/{empresa?.uf}</p>
                <p className="mt-0.5">{empresa?.email} • {empresa?.telefone}</p>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-block bg-slate-900 text-white px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm mb-3" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
              Relatório de Performance
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Período</p>
              <p className="text-base font-black text-slate-900 uppercase tracking-tight">{periodo}</p>
            </div>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2">
              Emitido: {now.toLocaleDateString('pt-BR')} às {now.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </header>

        {/* ═══════════ 1. KPIs EXECUTIVOS ═══════════ */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
            <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Resumo Executivo</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Vendas', val: r.total_vendas_valor, sub: `${r.total_vendas_qtd} un.`, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
              { label: 'Compras', val: r.total_compras_valor, sub: `${r.total_compras_qtd} un.`, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
              { label: 'Lucro Bruto', val: r.lucro_bruto, sub: `${r.margem_media.toFixed(1)}% margem`, bg: r.lucro_bruto >= 0 ? 'bg-emerald-50' : 'bg-rose-50', border: r.lucro_bruto >= 0 ? 'border-emerald-100' : 'border-rose-100', text: r.lucro_bruto >= 0 ? 'text-emerald-700' : 'text-rose-700' },
              { label: 'Ticket Médio', val: r.ticket_medio_venda, sub: 'por venda', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
            ].map((k, i) => (
              <div key={i} className={`p-3 rounded-xl border ${k.border} ${k.bg}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                <p className={`text-sm font-[900] tracking-tight ${k.text}`}>{fmt(k.val)}</p>
                <p className="text-[7px] font-bold text-slate-400 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ 2. FLUXO FINANCEIRO ═══════════ */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
            <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Fluxo Financeiro</h2>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Entradas', val: r.total_entradas, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
              { label: 'Saídas', val: r.total_saidas, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
              { label: 'A Receber', val: r.contas_receber_pendente, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
              { label: 'A Pagar', val: r.contas_pagar_pendente, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
              { label: 'Saldo Contas', val: r.saldo_contas_bancarias, bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-900' },
            ].map((k, i) => (
              <div key={i} className={`p-3 rounded-xl border ${k.border} ${k.bg}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                <p className={`text-sm font-[900] tracking-tight ${k.text}`}>{fmt(k.val)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
              <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest mb-1">Despesas com Veículos</p>
              <p className="text-sm font-[900] text-rose-700">{fmt(r.despesas_veiculos)}</p>
            </div>
            <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
              <p className="text-[7px] font-black text-amber-500 uppercase tracking-widest mb-1">Retiradas Sócios</p>
              <p className="text-sm font-[900] text-amber-700">{fmt(r.retiradas_socios)}</p>
            </div>
          </div>
        </section>

        {/* ═══════════ 3. CONTAS BANCÁRIAS ═══════════ */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
            <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Saldos Bancários</h2>
          </div>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                  <th className="pl-3 py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Banco</th>
                  <th className="py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Tipo</th>
                  <th className="pr-3 py-2 text-[8px] font-black uppercase text-slate-500 tracking-widest text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.contas_bancarias.map((c, i) => (
                  <tr key={i}>
                    <td className="pl-3 py-2 text-[9px] font-bold text-slate-700 uppercase">{c.banco_nome}</td>
                    <td className="py-2 text-[8px] font-medium text-slate-400 uppercase">{c.tipo}</td>
                    <td className={`pr-3 py-2 text-[9px] font-black text-right ${c.saldo_atual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(c.saldo_atual)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}>
                  <td colSpan={2} className="pl-3 py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">Total</td>
                  <td className="pr-3 py-2 text-[9px] font-black text-emerald-600 text-right">{fmt(r.saldo_contas_bancarias)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══════════ 4. VENDAS REALIZADAS ═══════════ */}
        {data.vendas.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Vendas Realizadas</h2>
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase">{data.vendas.length} venda{data.vendas.length !== 1 ? 's' : ''} • {fmt(r.total_vendas_valor)}</span>
            </div>
            <VendasTable data={data.vendas} variant="print" />
          </section>
        )}

        {/* ═══════════ 5. COMPRAS REALIZADAS ═══════════ */}
        {data.compras.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Compras Realizadas</h2>
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase">{data.compras.length} compra{data.compras.length !== 1 ? 's' : ''} • {fmt(r.total_compras_valor)}</span>
            </div>
            <ComprasTable data={data.compras} variant="print" />
          </section>
        )}

        {/* ═══════════ 6. CONTAS A RECEBER / PAGAR ═══════════ */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {/* Contas a Receber */}
            <div className="break-inside-avoid">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                  <h2 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em]">Contas a Receber</h2>
                </div>
                <span className="text-[8px] font-black text-emerald-600">{fmt(data.titulos_receber.reduce((s, t) => s + t.valor_total, 0))}</span>
              </div>
              <TitulosTable data={data.titulos_receber} variant="print" />
            </div>

            {/* Contas a Pagar */}
            <div className="break-inside-avoid">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                  <h2 className="text-[10px] font-black text-rose-900 uppercase tracking-[0.2em]">Contas a Pagar</h2>
                </div>
                <span className="text-[8px] font-black text-rose-600">{fmt(data.titulos_pagar.reduce((s, t) => s + t.valor_total, 0))}</span>
              </div>
              <TitulosTable data={data.titulos_pagar} variant="print" />
            </div>
          </div>
        </section>

        {/* ═══════════ 7. DESPESAS COM VEÍCULOS ═══════════ */}
        {data.despesas_veiculos.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Despesas com Veículos</h2>
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase">{fmt(r.despesas_veiculos)}</span>
            </div>
            <DespesasTable data={data.despesas_veiculos} variant="print" />
          </section>
        )}

        {/* ═══════════ 8. RETIRADAS SÓCIOS ═══════════ */}
        {data.retiradas.length > 0 && (
          <section className="mb-8 break-inside-avoid">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Retiradas de Sócios</h2>
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase">{fmt(r.retiradas_socios)}</span>
            </div>
            <RetiradasTable data={data.retiradas} variant="print" />
          </section>
        )}

        {/* ═══════════ 9. ESTOQUE ATUAL ═══════════ */}
        {data.estoque.length > 0 && (
          <section className="mb-8 break-before-page">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' as any }}></div>
                <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Estoque Atual</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[8px] font-black text-slate-400 uppercase">{data.estoque.length} veículo{data.estoque.length !== 1 ? 's' : ''}</span>
                <span className="text-[8px] font-black text-indigo-600 uppercase">{fmt(data.estoque.reduce((s, e) => s + e.valor_venda, 0))} em venda</span>
              </div>
            </div>
            <EstoqueTable data={data.estoque} variant="print" />
          </section>
        )}

        {/* ═══════════ FOOTER ═══════════ */}
        <div className="mt-auto border-t-2 border-slate-900 pt-6 flex items-center justify-between">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Nexus ERP • Relatório de Performance</p>
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Página 1</p>
        </div>
      </div>
    </div>
  );
};

export default PerformancePrint;
