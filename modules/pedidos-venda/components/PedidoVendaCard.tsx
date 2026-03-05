import React, { useState, useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
  onClick: () => void;
}

const PedidoVendaCard: React.FC<Props> = ({ pedido, onClick }) => {
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);

  // Atalhos para os dados
  const v = pedido.veiculo as any;
  const cliente = pedido.cliente;
  const fotos = v?.fotos || [];
  const hasPhotos = fotos.length > 0;
  const currentPhoto = hasPhotos ? fotos[activeVehicleIndex] : null;

  // CÁLCULOS FINANCEIROS COM FALLBACK
  // Se o valor_venda do pedido for 0 (rascunho), usamos o valor_venda do cadastro do veículo
  const valorVendaEfetivo = pedido.valor_venda > 0 ? pedido.valor_venda : (v?.valor_venda || 0);

  const custoBase = v?.valor_custo || 0;
  const custoServicos = v?.valor_custo_servicos || 0;
  const totalInvestido = custoBase + custoServicos;

  const lucroBruto = valorVendaEfetivo - totalInvestido;
  const margemPercentual = totalInvestido > 0 ? (lucroBruto / totalInvestido) * 100 : 0;

  // Consolidação de Sócios (Participação no Lucro Realizado/Projetado)
  const sociosNoLucro = useMemo(() => {
    if (!v?.socios) return [];
    return v.socios.map((s: any) => ({
      ...s,
      lucroProporcional: (s.porcentagem / 100) * lucroBruto
    }));
  }, [v?.socios, lucroBruto]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVehicleIndex((prev) => (prev + 1) % fotos.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveVehicleIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-emerald-300 transition-all duration-500 cursor-pointer flex flex-col h-full animate-in fade-in"
    >
      {/* 1. Área de Mídia (Carrossel) */}
      <div className="aspect-[16/10] bg-slate-900 relative overflow-hidden shrink-0">
        {hasPhotos ? (
          <>
            <img src={currentPhoto?.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Veículo" />
            {fotos.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handlePrev} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                <button onClick={handleNext} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg></button>
              </div>
            )}

            <div className="absolute top-4 left-4">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-slate-900 shadow-xl border border-white/50 uppercase tracking-tighter">
                {v?.placa || 'Sem Placa'}
              </div>
            </div>

            <div className="absolute bottom-4 right-4">
              <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                {activeVehicleIndex + 1} de {fotos.length} Fotos
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-100">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 text-center">Aguardando Fotos</p>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border-2 ${pedido.status === 'CONCLUIDO'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-indigo-500 text-white border-indigo-400 animate-pulse'
            }`}>
            {pedido.status === 'CONCLUIDO' ? 'FATURADO' : 'EM ABERTO'}
          </span>
        </div>
      </div>

      {/* 2. Informações Gerais */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedido #{pedido.numero_venda || '---'}</p>
            <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block uppercase">{formatDate(pedido.data_venda)}</p>
          </div>
          <div className="text-right min-w-0">
            <h4 className="text-xs font-black text-slate-800 uppercase truncate max-w-[150px] leading-none">
              {v?.modelo?.nome || 'Veículo N/D'}
            </h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
              {v?.montadora?.nome}
            </p>
          </div>
        </div>

        {/* Bloco Cliente - ATUALIZADO COM DOCUMENTO */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-slate-900 uppercase truncate leading-none mb-1">{cliente?.nome || 'Comprador N/D'}</p>
              <p className="text-[9px] font-mono text-slate-500 truncate mb-1">{cliente?.documento || 'Sem Documento'}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{cliente?.cidade}/{cliente?.uf}</p>
            </div>
          </div>
        </div>

        {/* Grid Financeiro - ATUALIZADO COM PREÇO EFETIVO */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Investimento</p>
            <p className="text-[10px] font-black text-slate-700 truncate">{formatCurrency(totalInvestido)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-1">Venda Final</p>
            <p className="text-[10px] font-black text-emerald-700 truncate">{formatCurrency(valorVendaEfetivo)}</p>
          </div>
          <div className={`rounded-xl p-3 shadow-lg ${lucroBruto >= 0 ? 'bg-slate-900' : 'bg-rose-900'}`}>
            <div className="flex justify-between items-start">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Margem</p>
              <span className={`text-[6px] font-black px-1 rounded ${lucroBruto >= 0 ? 'bg-emerald-500 text-white' : 'bg-white text-rose-600'}`}>
                {margemPercentual.toFixed(0)}%
              </span>
            </div>
            <p className={`text-[10px] font-black truncate ${lucroBruto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lucroBruto >= 0 ? '+' : ''}{formatCurrency(lucroBruto)}
            </p>
          </div>
        </div>

        {/* Investidores - RESULTADO REAL */}
        <div className="mt-auto pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Retorno p/ Sócio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sociosNoLucro.length > 0 ? sociosNoLucro.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 shadow-sm">
                <div className="w-5 h-5 bg-indigo-600 text-white rounded flex items-center justify-center text-[8px] font-black uppercase shrink-0 mr-2">{s.nome.charAt(0)}</div>
                <span className="text-[9px] font-black text-slate-700 mr-2 truncate max-w-[60px]">{s.nome.split(' ')[0]}</span>
                <span className={`text-[9px] font-black ${s.lucroProporcional >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(s.lucroProporcional)}
                </span>
              </div>
            )) : (
              <p className="text-[9px] text-slate-300 italic uppercase font-bold tracking-widest ml-1">Propriedade Integral</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoVendaCard;