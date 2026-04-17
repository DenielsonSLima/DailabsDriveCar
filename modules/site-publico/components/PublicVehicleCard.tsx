import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IVeiculoPublic } from '../site-publico.types';
import { ICor } from '../../cadastros/cores/cores.types';
import { formatCurrency } from '../utils/currency';

interface Props {
  veiculo: IVeiculoPublic;
  cores?: ICor[];
  onClick?: () => void;
}

const PublicVehicleCard: React.FC<Props> = React.memo(({ veiculo, cores = [] }) => {
  const navigate = useNavigate();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const v = veiculo;

  const fotos = useMemo(() => veiculo.fotos || [], [veiculo.fotos]);
  const hasPhotos = fotos.length > 0;
  const currentPhoto = hasPhotos ? fotos[activePhotoIndex] : null;

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % fotos.length);
  }, [fotos.length]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
  }, [fotos.length]);

  const handleClick = useCallback(() => {
    navigate(`/veiculo/${veiculo.id}`);
    window.scrollTo(0, 0);
  }, [navigate, veiculo.id]);

  return (
    <div
      onClick={handleClick}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-orange-500 transition-all duration-500 cursor-pointer flex flex-col h-full animate-in fade-in focus:outline-none focus:ring-4 focus:ring-orange-500/20"
    >
      {/* 1. Mídia / Carrossel */}
      <div className="aspect-[16/10] bg-slate-900 relative overflow-hidden shrink-0">
        {hasPhotos ? (
          <>
            <img src={currentPhoto?.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={`${v.montadora?.nome || ''} ${v.modelo?.nome || ''} ${v.ano_modelo || ''} - ${v.versao?.nome || ''}`.trim()} loading="lazy" decoding="async" />
            {fotos.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={handlePrev} aria-label="Foto anterior" className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-orange-600 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleNext} aria-label="Próxima foto" className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-orange-600 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-100">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {veiculo.tipo_veiculo?.nome && (
            <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[7px] font-black shadow-xl border border-white/10 uppercase tracking-[0.3em] w-fit">
              {veiculo.tipo_veiculo.nome}
            </div>
          )}
          <div className="bg-orange-600 text-white px-4 py-1.5 rounded-full text-[8px] font-black shadow-xl border border-white/20 uppercase tracking-[0.2em]">
            Destaque Souza
          </div>
          {veiculo.status !== 'DISPONIVEL' && (
            <div className={`text-white px-3 py-1 rounded-full text-[8px] font-black shadow-xl uppercase tracking-widest w-fit ${veiculo.status === 'VENDIDO' ? 'bg-rose-500' :
                veiculo.status === 'RESERVADO' ? 'bg-amber-500' :
                  'bg-slate-700'
              }`}>
              {veiculo.status === 'PREPARACAO' ? 'EM PREPARAÇÃO' : veiculo.status}
            </div>
          )}
          {veiculo.km < 10000 && (
            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black shadow-xl uppercase tracking-widest animate-pulse w-fit">
              Baixa KM
            </div>
          )}
        </div>
      </div>

      {/* 2. Conteúdo Info */}
      <div className="p-7 flex flex-col flex-1">
        <div className="mb-6 min-w-0">
          <div className="flex items-center gap-2 mb-2 h-6">
            {v.montadora?.logo_url ? (
              <img src={v.montadora.logo_url} className="h-6 w-auto object-contain opacity-80" alt="" />
            ) : (
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] truncate">{v.montadora?.nome}</p>
            )}
          </div>
          <h3 className="text-xl font-[900] text-slate-900 uppercase tracking-tighter truncate leading-tight mb-1 group-hover:text-orange-600 transition-colors">
            {v.modelo?.nome}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight truncate">
            {v.versao?.nome} {v.motorizacao} {v.combustivel}
          </p>

          <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wide border-t border-slate-100 pt-3 mt-1">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <svg className="w-3 h-3 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="truncate">{v.motorizacao}</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <svg className="w-3 h-3 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <span className="truncate">{v.combustivel}</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <svg className="w-3 h-3 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              <span className="truncate">{v.transmissao}</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <svg className="w-3 h-3 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{v.ano_fabricacao}/{v.ano_modelo}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{veiculo.km.toLocaleString('pt-BR')} KM</span>
          </div>
        </div>

        {/* 3. Preço e Ação Final */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Valor</p>
            <p className="text-3xl font-[900] text-orange-600 tracking-tighter leading-none">{formatCurrency(veiculo.valor_venda)}</p>
          </div>

          <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl group-hover:bg-orange-600 group-hover:scale-110 transition-all active:scale-95">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
});

PublicVehicleCard.displayName = 'PublicVehicleCard';

export default PublicVehicleCard;