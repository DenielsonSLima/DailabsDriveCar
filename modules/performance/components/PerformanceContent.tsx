import React, { useState } from 'react';
import { IPerformanceData } from '../performance.types';
import { KpiCard, SecaoHeader } from './PerformanceUI';
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
  periodoLabel: string;
  isFetching?: boolean;
}

type SecaoAberta = 'vendas' | 'compras' | 'pagar' | 'receber' | 'despesas' | 'retiradas' | 'estoque' | 'contas' | null;

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const PerformanceContent: React.FC<Props> = ({ data, periodoLabel, isFetching = false }) => {
  const [secaoAberta, setSecaoAberta] = useState<SecaoAberta>(null);
  const r = data.resumo;

  const toggle = (secao: SecaoAberta) => {
    setSecaoAberta(prev => (prev === secao ? null : secao));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Período Label */}
      <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{periodoLabel}</span>
      </div>

      {/* ================== KPIs GRID ================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Vendas"
          valor={r.total_vendas_valor}
          sub={`${r.total_vendas_qtd} veículo${r.total_vendas_qtd !== 1 ? 's' : ''} vendido${r.total_vendas_qtd !== 1 ? 's' : ''}`}
          color="emerald"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <KpiCard
          label="Compras"
          valor={r.total_compras_valor}
          sub={`${r.total_compras_qtd} veículo${r.total_compras_qtd !== 1 ? 's' : ''} comprado${r.total_compras_qtd !== 1 ? 's' : ''}`}
          color="blue"
          icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
        <KpiCard
          label="Lucro Bruto"
          valor={r.lucro_bruto}
          sub={`Margem média: ${r.margem_media.toFixed(1)}%`}
          color={r.lucro_bruto >= 0 ? 'emerald' : 'rose'}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
        <KpiCard
          label="Ticket Médio"
          valor={r.ticket_medio_venda}
          sub="Valor médio por venda"
          color="indigo"
          icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
        <KpiCard
          label="Entradas"
          valor={r.total_entradas}
          sub="Total recebido no período"
          color="emerald"
          icon="M7 11l5-5m0 0l5 5m-5-5v12"
        />
        <KpiCard
          label="Saídas"
          valor={r.total_saidas}
          sub="Total pago no período"
          color="rose"
          icon="M17 13l-5 5m0 0l-5-5m5 5V6"
        />
        <KpiCard
          label="A Receber"
          valor={r.contas_receber_pendente}
          sub={`Recebido: ${formatCurrency(r.contas_receber_pago)}`}
          color="amber"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <KpiCard
          label="A Pagar"
          valor={r.contas_pagar_pendente}
          sub={`Pago: ${formatCurrency(r.contas_pagar_pago)}`}
          color="rose"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </div>

      {/* ================== CARDS DESTAQUE ================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-[60px] opacity-20"></div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Saldo Total Contas</p>
          <h3 className="text-2xl font-black tracking-tight">{formatCurrency(r.saldo_contas_bancarias)}</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-2">{data.contas_bancarias.length} conta{data.contas_bancarias.length !== 1 ? 's' : ''} ativa{data.contas_bancarias.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Despesas Veículos</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(r.despesas_veiculos)}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{data.despesas_veiculos.length} lançamento{data.despesas_veiculos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Retiradas Sócios</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(r.retiradas_socios)}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{data.retiradas.length} retirada{data.retiradas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ================== SEÇÕES EXPANSÍVEIS ================== */}
      <div className="space-y-3">
        {/* ---- VENDAS ---- */}
        <SecaoHeader
          id="vendas"
          titulo="Vendas Realizadas"
          subtitulo="Detalhamento das vendas concluídas"
          count={data.vendas.length}
          valor={r.total_vendas_valor}
          icon="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          color="emerald"
          isOpen={secaoAberta === 'vendas'}
          onToggle={() => toggle('vendas')}
        />
        {secaoAberta === 'vendas' && <VendasTable data={data.vendas} />}

        {/* ---- COMPRAS ---- */}
        <SecaoHeader
          id="compras"
          titulo="Compras Realizadas"
          subtitulo="Aquisições concluídas no período"
          count={data.compras.length}
          valor={r.total_compras_valor}
          icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          color="blue"
          isOpen={secaoAberta === 'compras'}
          onToggle={() => toggle('compras')}
        />
        {secaoAberta === 'compras' && <ComprasTable data={data.compras} />}

        {/* ---- CONTAS A RECEBER ---- */}
        <SecaoHeader
          id="receber"
          titulo="Contas a Receber"
          subtitulo="Títulos com vencimento no período"
          count={data.titulos_receber.length}
          valor={data.titulos_receber.reduce((s, t) => s + t.valor_total, 0)}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          color="amber"
          isOpen={secaoAberta === 'receber'}
          onToggle={() => toggle('receber')}
        />
        {secaoAberta === 'receber' && <TitulosTable data={data.titulos_receber} />}

        {/* ---- CONTAS A PAGAR ---- */}
        <SecaoHeader
          id="pagar"
          titulo="Contas a Pagar"
          subtitulo="Títulos com vencimento no período"
          count={data.titulos_pagar.length}
          valor={data.titulos_pagar.reduce((s, t) => s + t.valor_total, 0)}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          color="rose"
          isOpen={secaoAberta === 'pagar'}
          onToggle={() => toggle('pagar')}
        />
        {secaoAberta === 'pagar' && <TitulosTable data={data.titulos_pagar} />}

        {/* ---- DESPESAS VEÍCULOS ---- */}
        <SecaoHeader
          id="despesas"
          titulo="Despesas com Veículos"
          subtitulo="Serviços, reformas e custos veiculares"
          count={data.despesas_veiculos.length}
          valor={r.despesas_veiculos}
          icon="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          color="orange"
          isOpen={secaoAberta === 'despesas'}
          onToggle={() => toggle('despesas')}
        />
        {secaoAberta === 'despesas' && <DespesasTable data={data.despesas_veiculos} />}

        {/* ---- RETIRADAS SÓCIOS ---- */}
        <SecaoHeader
          id="retiradas"
          titulo="Retiradas de Sócios"
          subtitulo="Distribuições e pró-labore"
          count={data.retiradas.length}
          valor={r.retiradas_socios}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          color="purple"
          isOpen={secaoAberta === 'retiradas'}
          onToggle={() => toggle('retiradas')}
        />
        {secaoAberta === 'retiradas' && <RetiradasTable data={data.retiradas} />}

        {/* ---- ESTOQUE ATUAL ---- */}
        <SecaoHeader
          id="estoque"
          titulo="Estoque Atual"
          subtitulo="Veículos disponíveis no pátio"
          count={data.estoque.length}
          valor={data.estoque.reduce((s, e) => s + e.valor_venda, 0)}
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          color="indigo"
          isOpen={secaoAberta === 'estoque'}
          onToggle={() => toggle('estoque')}
        />
        {secaoAberta === 'estoque' && <EstoqueTable data={data.estoque} />}

        {/* ---- CONTAS BANCÁRIAS ---- */}
        <SecaoHeader
          id="contas"
          titulo="Contas Bancárias"
          subtitulo="Saldos atuais das contas ativas"
          count={data.contas_bancarias.length}
          valor={r.saldo_contas_bancarias}
          icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          color="slate"
          isOpen={secaoAberta === 'contas'}
          onToggle={() => toggle('contas')}
        />
        {secaoAberta === 'contas' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            {data.contas_bancarias.length === 0 ? (
              <p className="text-sm text-slate-400 font-bold text-center py-10">Nenhuma conta bancária ativa.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                {data.contas_bancarias.map(c => (
                  <div key={c.id} className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{c.banco_nome}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase px-2 py-0.5 bg-white rounded border border-slate-200">{c.tipo}</span>
                    </div>
                    <h4 className={`text-lg font-black tracking-tight ${c.saldo_atual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(c.saldo_atual)}
                    </h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceContent;
