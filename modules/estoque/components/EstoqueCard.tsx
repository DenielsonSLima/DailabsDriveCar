import React, { useState } from 'react';
import { IVeiculo } from '../estoque.types';
import { ICor } from '../../cadastros/cores/cores.types';
import { EstoqueService } from '../estoque.service';
import ConfirmModal from '../../../components/ConfirmModal';

interface Props {
  veiculo: IVeiculo;
  cores: ICor[];
  onClick: () => void;
}

/**
 * Componente de Card para listagem de estoque.
 * Possui carrossel de fotos, indicação de status e toggle de publicação no site.
 */
const EstoqueCard: React.FC<Props> = ({ veiculo, cores, onClick }) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [localPublicado, setLocalPublicado] = useState(veiculo.publicado_site);
  const [isToggling, setIsToggling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const v = veiculo as any;

  const fotos = veiculo.fotos || [];
  const hasPhotos = fotos.length > 0;
  const currentPhoto = hasPhotos ? fotos[activePhotoIndex] : null;
  const corObj = cores.find(c => c.id === veiculo.cor_id);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % fotos.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Modal abre sempre
    setShowConfirm(true);
  };

  const executeToggle = async () => {
    // Validação antes de salvar
    if (veiculo.status !== 'DISPONIVEL' && !localPublicado) {
      alert("Apenas veículos DISPONÍVEIS podem ser publicados no site.");
      setShowConfirm(false);
      return;
    }

    setIsToggling(true);
    setShowConfirm(false);
    try {
      const novoStatus = !localPublicado;
      await EstoqueService.save({ id: veiculo.id, publicado_site: novoStatus });
      setLocalPublicado(novoStatus);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao atualizar publicação: " + (err.message || 'Falha de permissão.'));
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONIVEL': return 'bg-emerald-500 shadow-emerald-200';
      case 'RESERVADO': return 'bg-amber-500 shadow-amber-200';
      case 'VENDIDO': return 'bg-rose-500 shadow-rose-200';
      case 'PREPARACAO': return 'bg-indigo-500 shadow-indigo-200';
      default: return 'bg-slate-400 shadow-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
    >
      {/* Imagem / Carrossel */}
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden shrink-0">
        {hasPhotos ? (
          <>
            <img src={currentPhoto?.url} alt={veiculo.placa} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            {fotos.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={handlePrev} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleNext} className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Sem Foto</span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
          <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${getStatusColor(veiculo.status)}`}>
            {veiculo.status}
          </div>

          {v.tipo_veiculo?.nome && (
            <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg bg-slate-900 shadow-slate-200 ring-1 ring-white/20">
              {v.tipo_veiculo.nome}
            </div>
          )}

          {veiculo.is_consignado && (
            <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg bg-violet-600 shadow-violet-200 ring-2 ring-violet-400">
              CONSIGNADO
            </div>
          )}

          <button
            onClick={handleToggleClick}
            disabled={isToggling}
            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-1.5 border ${localPublicado ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/90 text-slate-400 border-slate-200'
              }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${localPublicado ? 'bg-white animate-pulse' : 'bg-slate-300'}`}></div>
            {localPublicado ? 'No Site' : 'Interno'}
          </button>
        </div>

        <div className="absolute bottom-3 left-3 z-10">
          <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-md border border-slate-200 text-[10px] font-mono font-bold text-slate-700 shadow-sm uppercase">
            {veiculo.placa || 'SEM PLACA'}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{veiculo.ano_fabricacao}/{veiculo.ano_modelo}</span>
            {corObj && (
              <>
                <span className="text-slate-300 text-[10px]">•</span>
                <div className="w-2 h-2 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: corObj.rgb_hex }} title={corObj.nome}></div>
              </>
            )}
            <span className="text-slate-300 text-[10px]">•</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{veiculo.km.toLocaleString()} km</span>
          </div>

          <h4 className="font-black text-slate-900 text-lg leading-tight line-clamp-2 uppercase tracking-tighter">
            {v.montadora?.nome} {v.modelo?.nome}
          </h4>
          <p className="text-[11px] text-slate-500 font-bold truncate mt-0.5 uppercase tracking-tight">
            {v.versao?.nome || 'Versão Base'} {v.motorizacao} {v.combustivel}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between">
          <div>
            <div className="mb-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Investimento (Custo)</p>
              <p className="text-sm font-black text-slate-700 tracking-tight">
                {formatCurrency(
                  veiculo.is_consignado
                    ? (Number(veiculo.valor_custo_servicos) || 0)
                    : ((Number(veiculo.valor_custo) || 0) + (Number(veiculo.valor_custo_servicos) || 0))
                )}
              </p>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Preço Venda</p>
            <p className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(veiculo.valor_venda)}</p>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeToggle}
        title={localPublicado ? "Remover do Site?" : "Publicar no Site?"}
        message={localPublicado
          ? "Este veículo deixará de ser exibido na vitrine pública."
          : "Este veículo ficará visível para clientes no seu site oficial."}
        confirmText={localPublicado ? "Sim, Remover" : "Sim, Publicar"}
        variant={localPublicado ? 'danger' : 'info'}
        isLoading={isToggling}
      />
    </div>
  );
};

export default EstoqueCard;