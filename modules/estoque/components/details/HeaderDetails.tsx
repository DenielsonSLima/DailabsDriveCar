import React, { useState } from 'react';
import { IVeiculo } from '../../estoque.types';
import { EstoqueService } from '../../estoque.service';
import ConfirmModal from '../../../../components/ConfirmModal';

interface HeaderDetailsProps {
  veiculo: IVeiculo;
  onBack: () => void;
  onEdit: () => void;
}

const HeaderDetails: React.FC<HeaderDetailsProps> = ({ veiculo, onBack, onEdit }) => {
  const v = veiculo as any;
  const [localPublicado, setLocalPublicado] = useState(veiculo.publicado_site);
  const [isToggling, setIsToggling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirm = () => {
    // Modal abre sempre para confirmação visual rápida
    setShowConfirmModal(true);
  };

  const handleExecuteToggle = async () => {
    // Validação de negócio: Apenas DISPONIVEL pode ir para o site
    if (veiculo.status !== 'DISPONIVEL' && !localPublicado) {
      alert("Apenas veículos DISPONÍVEIS podem ser publicados no site.");
      setShowConfirmModal(false);
      return;
    }

    setIsToggling(true);
    setShowConfirmModal(false);
    try {
      const novoStatus = !localPublicado;
      await EstoqueService.save({ id: veiculo.id, publicado_site: novoStatus });
      setLocalPublicado(novoStatus);
    } catch (err: any) {
      alert("Erro ao atualizar status do site: " + (err.message || 'Verifique se você tem permissão.'));
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Lado Esquerdo: Navegação, Logo e Infos */}
        <div className="flex items-center gap-6 w-full lg:w-auto">
          <button 
            onClick={onBack} 
            className="group p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition-all shrink-0 shadow-sm"
          >
            <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Logo da Montadora */}
          <div 
            className="w-24 h-24 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-2 shrink-0 shadow-sm overflow-hidden gap-1"
            title={v.montadora?.nome}
          >
              {v.montadora?.logo_url ? (
                <>
                  <img src={v.montadora.logo_url} className="w-full h-12 object-contain" alt={v.montadora.nome} />
                  <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest text-center leading-none mt-1 opacity-80">
                    {v.montadora?.nome}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                   <span className="text-2xl font-black text-slate-300 mb-1">{v.montadora?.nome?.charAt(0) || '?'}</span>
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center leading-none">{v.montadora?.nome}</span>
                </div>
              )}
           </div>

           {/* Informações Principais */}
           <div className="flex flex-col">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">
                {v.modelo?.nome || 'MODELO'}
              </h1>

              <h2 className="text-lg font-bold text-slate-500 mb-3 truncate max-w-2xl border-l-4 border-indigo-600 pl-4 uppercase tracking-tight">
                {v.versao?.nome || 'Versão não informada'} {v.motorizacao} {v.combustivel}
              </h2>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700">
                  {v.tipo_veiculo?.nome || 'N/D'}
                </span>
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-700">
                  {v.ano_fabricacao}/{v.ano_modelo}
                </span>
                
                {/* Badge de Status de Publicação */}
                <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border ${
                  localPublicado ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                   <div className={`w-1.5 h-1.5 rounded-full ${localPublicado ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                   <span className="font-black uppercase">{localPublicado ? 'Publicado no Site' : 'Catálogo Interno'}</span>
                </div>
              </div>
           </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0">
          
          {/* Botão de Toggle de Publicação */}
          {veiculo.status !== 'VENDIDO' && (
            <button 
              onClick={handleOpenConfirm}
              disabled={isToggling}
              className={`px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center border-2 ${
                localPublicado 
                  ? 'bg-white border-emerald-500 text-emerald-600 hover:bg-emerald-50' 
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
            >
              {isToggling ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              )}
              {localPublicado ? 'Remover do Site' : 'Publicar no Site'}
            </button>
          )}

          <button 
            onClick={onEdit}
            className="px-8 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center active:scale-95"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Veículo
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleExecuteToggle}
        title={localPublicado ? "Remover da Vitrine?" : "Publicar no Site?"}
        message={localPublicado 
          ? "Deseja realmente remover este veículo da vitrine pública? Ele continuará visível apenas no seu estoque interno."
          : "Ao publicar, este veículo ficará visível para todos os clientes na vitrine pública do site."
        }
        confirmText={localPublicado ? "Sim, Remover" : "Sim, Publicar Agora"}
        cancelText="Cancelar"
        variant={localPublicado ? "danger" : "info"}
        isLoading={isToggling}
      />
    </div>
  );
};

export default HeaderDetails;