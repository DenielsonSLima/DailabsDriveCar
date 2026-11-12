
import React, { useState } from 'react';
import { IPedidoCompra } from '../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
  onClick: () => void;
}

const PedidoCompraCard: React.FC<Props> = ({ pedido, onClick }) => {
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);

  const veiculos = pedido.veiculos || [];
  const hasVeiculos = veiculos.length > 0;
  const currentVeiculo = hasVeiculos ? veiculos[Math.min(activeVehicleIndex, veiculos.length - 1)] : null;
  const v = currentVeiculo as any;
  const todosVendidos = hasVeiculos && veiculos.every((v: any) => v.status === 'VENDIDO');
  const isConsignacao = pedido.forma_pagamento?.nome?.toLowerCase().includes('consigna') || false;
  const capaUrl = v?.fotos?.find((f: any) => f.is_capa)?.url || v?.fotos?.[0]?.url;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  // Cálculos Financeiros Agregados
  const custoAquisicaoBase = veiculos.reduce((acc, v: any) => acc + (Number(v.valor_custo) || 0), 0);
  const valorPedido = Number(pedido.valor_negociado) || 0;
  const custoAquisicao = valorPedido > 0 ? valorPedido : custoAquisicaoBase;

  const custoServicos = veiculos.reduce((acc, v: any) => acc + (Number(v.valor_custo_servicos) || 0), 0);
  const totalInvestido = custoAquisicao + custoServicos;

  // Consolidação de Sócios
  const sociosAgrupados = React.useMemo(() => {
    const map = new Map<string, { nome: string, valor: number, porcentagemTotal: number }>();
    veiculos.forEach((v: any) => {
      v.socios?.forEach((s: any) => {
        const perc = Number(s.porcentagem) || 0;
        // The value each partner invests is their percentage applied to the total lot investment
        const investidoSocio = totalInvestido * (perc / 100);

        const current = map.get(s.socio_id) || { nome: s.nome, valor: 0, porcentagemTotal: 0 };
        map.set(s.socio_id, {
          nome: s.nome,
          valor: current.valor + investidoSocio,
          porcentagemTotal: current.porcentagemTotal + perc
        });
      });
    });
    return Array.from(map.values()).map(s => ({
      nome: s.nome,
      valor: s.valor,
      porcentagem: totalInvestido > 0 ? (s.valor / totalInvestido) * 100 : s.porcentagemTotal
    }));
  }, [veiculos, totalInvestido]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVehicleIndex((prev) => (prev + 1) % veiculos.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVehicleIndex((prev) => (prev - 1 + veiculos.length) % veiculos.length);
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-sm hover:border-indigo-300 transition-all duration-500 cursor-pointer flex flex-col h-full animate-in fade-in"
    >
      {/* 1. Área de Mídia (Carrossel) */}
      <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden shrink-0">
        {hasVeiculos ? (
          <>
            {capaUrl ? (
              <img src={capaUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Veículo" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-xs font-semibold normal-case tracking-normal mt-2">Sem Imagem Disponível</span>
              </div>
            )}

            {veiculos.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handlePrev} className="dc-button p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                <button onClick={handleNext} className="dc-button p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg></button>
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl text-xs font-semibold text-slate-900 shadow-sm border border-white/50 normal-case tracking-normal">
                {v?.placa || 'Sem Placa'}
              </div>
            </div>

            <div className="absolute bottom-4 right-4">
              <span className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-white normal-case tracking-normal border border-white/10">
                {activeVehicleIndex + 1} de {veiculos.length} {todosVendidos ? 'Vendidos' : 'Ativos'}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-100">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs font-semibold normal-case tracking-normal opacity-30 px-10 text-center">Nenhum veículo vinculado</p>
          </div>
        )}

        {/* Status Badge - AJUSTADO PARA MÁXIMA VISIBILIDADE */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold normal-case tracking-normal shadow-sm border-2 ${pedido.status === 'CONCLUIDO'
            ? 'bg-emerald-600 text-white border-emerald-500'
            : 'bg-amber-500 text-white border-amber-400 animate-pulse'
            }`}>
            {pedido.status}
          </span>
          {isConsignacao && (
            <span className="px-3 py-1 rounded-xl text-xs font-semibold normal-case tracking-normal shadow-sm border-2 bg-violet-600 text-white border-violet-500">
              Consignado
            </span>
          )}
          {todosVendidos && (
            <span className="px-3 py-1 rounded-xl text-xs font-semibold normal-case tracking-normal shadow-sm border-2 bg-rose-500 text-white border-rose-400">
              Veículo Vendido
            </span>
          )}
        </div>
      </div>

      {/* 2. Informações Gerais do Pedido */}
      <div className="p-4 flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Pedido #{pedido.numero_pedido || '---'}</p>
            <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block normal-case">{formatDate(pedido.data_compra)}</p>
          </div>
          {hasVeiculos && (
            <div className="text-right">
              <h4 className="dc-section-title font-semibold text-slate-800 normal-case max-w-[110px]">
                {v?.modelo?.nome}
              </h4>
              <p className="text-xs font-semibold text-slate-400 normal-case mt-1">
                {v?.montadora?.nome}
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-4">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 normal-case truncate leading-none mb-1">{pedido.fornecedor?.nome || 'Fornecedor N/D'}</p>
              <p className="text-xs font-mono text-slate-500 truncate mb-2">{pedido.fornecedor?.documento || 'Sem documento'}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal">{pedido.fornecedor?.cidade}/{pedido.fornecedor?.uf}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-xs font-semibold text-slate-600 normal-case tracking-normal mb-1">Custo Base</p>
            <p className="text-sm font-semibold text-slate-700 tabular-nums whitespace-nowrap">{formatCurrency(custoAquisicao)}</p>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-xs font-semibold text-slate-600 normal-case tracking-normal mb-1">Serviços</p>
            <p className="text-sm font-semibold text-indigo-600 tabular-nums whitespace-nowrap">+{formatCurrency(custoServicos)}</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Total Ativo</p>
            <p className="text-sm font-semibold text-emerald-400 tabular-nums whitespace-nowrap">{formatCurrency(totalInvestido)}</p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Investidores</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {sociosAgrupados.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 shadow-sm w-full">
                <div className="flex items-center min-w-0">
                  <div className="w-5 h-5 bg-indigo-600 text-white rounded flex items-center justify-center text-xs font-semibold normal-case shrink-0 mr-2">{s.nome.charAt(0)}</div>
                  <span title={s.nome} className="text-sm font-semibold text-slate-700 tabular-nums break-words max-w-[90px]">{s.nome.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold flex-wrap justify-end">
                  <span className="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">{s.porcentagem.toFixed(0)}%</span>
                  <span className="text-slate-500">{formatCurrency(s.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoCompraCard;
