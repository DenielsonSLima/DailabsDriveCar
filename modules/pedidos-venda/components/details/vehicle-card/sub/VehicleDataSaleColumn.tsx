import React from 'react';
import { IVeiculo } from '../../../../../estoque/estoque.types';

interface Props {
  veiculo: IVeiculo;
  isConcluido: boolean;
  isConsignado?: boolean;
  isEditingPrice: boolean;
  localPrice: number;
  onStartEditPrice: (e: React.MouseEvent) => void;
  onCurrencyInput: (val: string) => void;
  onSavePrice: (e: React.MouseEvent) => void;
  onUnlink: (e: React.MouseEvent) => void;
}

const VehicleDataSaleColumn: React.FC<Props> = ({
  veiculo,
  isConcluido,
  isConsignado,
  isEditingPrice,
  localPrice,
  onStartEditPrice,
  onCurrencyInput,
  onSavePrice,
  onUnlink
}) => {
  const v = veiculo as any;
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const valorServicos = (v.valor_custo_servicos || 0);
  const totalInvestido = (veiculo.valor_custo || 0) + valorServicos;

  return (
    <div className="p-8 flex flex-col h-full bg-white min-w-0">
      {/* Header: Brand, Model, Version */}
      <div className="flex items-center gap-5 mb-8 min-w-0">
        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center p-3 shrink-0 shadow-inner overflow-hidden">
          {v.montadora?.logo_url ? (
            <img src={v.montadora.logo_url} className="max-h-full max-w-full object-contain" alt={v.montadora?.nome} />
          ) : (
            <div className="text-center">
              <p className="text-xl font-black text-slate-300 leading-none">{v.montadora?.nome?.charAt(0) || '?'}</p>
              <p className="text-[7px] font-black text-slate-400 uppercase mt-1 leading-none">Logo</p>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1 truncate">Fabricante: {v.montadora?.nome || 'Não Definido'}</p>
          <div className="flex items-baseline gap-3 min-w-0 overflow-hidden">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter truncate leading-none">{v.modelo?.nome || 'Modelo'}</h3>
            <span className="text-base font-bold text-slate-400 truncate border-l border-slate-200 pl-3 leading-none">{v.versao?.nome || 'Versão'}</span>
          </div>
        </div>

        {!isConcluido && (
          <button
            onClick={onUnlink}
            className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm shrink-0 border border-slate-100"
            title="Remover veículo da venda"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        )}
      </div>

      {/* Specs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Categoria', value: v.tipo_veiculo?.nome || 'N/D' },
          { label: 'Motorização', value: veiculo.motorizacao || v.versao?.motorizacao || 'N/D' },
          { label: 'Combustível', value: veiculo.combustivel || v.versao?.combustivel || 'N/D' },
          { label: 'Câmbio', value: veiculo.transmissao || v.versao?.transmissao || 'N/D' },
          { label: 'Fab / Modelo', value: `${veiculo.ano_fabricacao || v.versao?.ano_fabricacao || '?'} / ${veiculo.ano_modelo || v.versao?.ano_modelo || '?'}` },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100 min-w-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{item.label}</p>
            <p className="text-[10px] font-bold text-slate-700 truncate uppercase">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Identificação Bar */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-slate-900 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="flex-1 relative z-10 min-w-0">
          <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Placa Oficial</p>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-2.5 bg-blue-700 rounded-[1px] shadow-sm"></div>
            <span className="text-xl font-black font-mono tracking-[0.15em] uppercase truncate">{veiculo.placa || 'AAAAAAA'}</span>
          </div>
        </div>
        <div className="flex-1 relative z-10 min-w-0 border-l border-white/10 pl-4">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Chassi</p>
          <span className="text-[10px] font-mono font-bold tracking-wider truncate block">{veiculo.chassi || 'N/A'}</span>
        </div>
        <div className="flex-1 relative z-10 text-right min-w-0 border-l border-white/10 pl-4">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Quilometragem</p>
          <span className="text-xl font-black text-emerald-400 tracking-tight truncate block">
            {veiculo.km.toLocaleString()} <small className="text-[9px] uppercase opacity-60">km</small>
          </span>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border rounded-2xl p-3 shadow-sm border-slate-100 flex flex-col justify-center h-20 min-w-0">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Custo Aquisição</p>
          <p className="text-xs font-black text-slate-600 tracking-tighter truncate">{formatCurrency(veiculo.valor_custo || 0)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-3 shadow-sm border-indigo-100 flex flex-col justify-center h-20 min-w-0">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Serviços Executados</p>
          <p className="text-xs font-black text-indigo-600 tracking-tighter truncate">{formatCurrency(valorServicos)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-3 shadow-sm border-amber-100 flex flex-col justify-center h-20 min-w-0">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">Investimento Total</p>
          <p className="text-xs font-black text-amber-600 tracking-tighter truncate">{formatCurrency(totalInvestido)}</p>
        </div>
      </div>

      {/* Preço de Venda (Destaque Editável - Refinado) */}
      <div
        className={`mb-8 px-4 py-3 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[76px] relative group/price overflow-hidden
          ${isEditingPrice && !isConcluido
            ? 'bg-emerald-50 border-emerald-500 shadow-inner'
            : 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'
          }`}
        onClick={!isEditingPrice && !isConcluido ? onStartEditPrice : undefined}
      >
        <div className="absolute top-2.5 left-4 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">
            {isConsignado ? 'Preço de Venda' : 'Preço Negociado'}
          </p>
        </div>

        {isEditingPrice && !isConcluido ? (
          <div className="flex flex-col items-center w-full max-w-sm gap-2 px-2 mt-4" onClick={e => e.stopPropagation()}>
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-black text-emerald-300 italic">R$</span>
              <input
                autoFocus
                type="text"
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(localPrice).replace('R$', '').trim()}
                onChange={(e) => onCurrencyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSavePrice(e as any)}
                className="w-full bg-white border-2 border-emerald-500 rounded-xl pl-10 pr-3 py-1.5 text-xl font-black text-emerald-700 outline-none shadow-md focus:ring-4 focus:ring-emerald-200 transition-all text-right"
                placeholder="0,00"
              />
            </div>
            <button
              onClick={onSavePrice}
              className="w-full py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
              Confirmar
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-3">
            <h2 className="text-2xl font-black text-emerald-700 tracking-tighter">
              {formatCurrency(veiculo.valor_venda || 0)}
            </h2>
            {!isConcluido && (
              <div className="flex items-center gap-1 mt-0.5 px-2 py-[1px] bg-emerald-100/50 rounded-full border border-emerald-200 opacity-60 group-hover/price:opacity-100 transition-all">
                <svg className="w-2 h-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span className="text-[7px] font-black text-emerald-600 uppercase tracking-wider">Editar</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sócio Shares */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
          <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Composição Societária do Ativo
        </h4>
        <div className="flex flex-wrap gap-2.5">
          {veiculo.socios && veiculo.socios.length > 0 ? veiculo.socios.map((s, idx) => (
            <div key={idx} className="flex items-center space-x-2.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 min-w-[130px] max-w-[160px]">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black shadow-md shrink-0 uppercase">{s.nome.charAt(0)}</div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-tighter truncate">{s.nome}</p>
                <p className="text-[8px] font-black text-emerald-600 leading-none">{s.porcentagem}% Participação</p>
              </div>
            </div>
          )) : (
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-dashed border-slate-100 w-full text-center py-3 rounded-xl italic">Sem sócios vinculados ao ativo.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDataSaleColumn;