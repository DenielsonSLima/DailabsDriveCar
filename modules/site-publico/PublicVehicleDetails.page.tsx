import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { SitePublicoService } from './site-publico.service';
import { IVeiculoPublic } from './site-publico.types';
import { IEmpresa } from '../ajustes/empresa/empresa.types';
import { formatCurrency } from './utils/currency';

import PublicNavbar from './components/PublicNavbar';
import PublicFooter from './components/PublicFooter';
import VehicleDetailsSkeleton from './components/VehicleDetailsSkeleton';
import { setSEO, setVehicleJsonLd, removeJsonLd } from './utils/seo';

const PublicVehicleDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // TanStack Query: Carrega todos os dados necessários em uma única chamada paralela no serviço
  const { data, isLoading } = useQuery({
    queryKey: ['veiculo_detalhes', id],
    queryFn: () => SitePublicoService.getVeiculoDetails(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const veiculo = data?.veiculo;
  const empresa = data?.empresa;
  const allCaracteristicas = data?.caracteristicas || [];
  const allOpcionais = data?.opcionais || [];
  const cores = data?.cores || [];

  const sortedPhotos = useMemo(
    () => veiculo?.fotos ? [...veiculo.fotos].sort((a, b) => (a.is_capa === b.is_capa ? 0 : a.is_capa ? -1 : 1)) : [],
    [veiculo?.fotos]
  );

  // Define foto inicial quando o veículo carrega
  useEffect(() => {
    if (sortedPhotos.length > 0 && !activePhoto) {
      setActivePhoto(sortedPhotos[0].url);
      setActivePhotoIndex(0);
    }
  }, [sortedPhotos, activePhoto]);

  // SEO & JSON-LD Effect
  useEffect(() => {
    if (!veiculo || !empresa) return;

    const veiculoTitle = `${veiculo.montadora?.nome || ''} ${veiculo.modelo?.nome || ''} ${veiculo.ano_modelo}`;
    const coverPhoto = sortedPhotos.length > 0 ? sortedPhotos[0].url : undefined;
    const veiculoUrl = `${window.location.origin}/veiculo/${id}`;

    setSEO({
      title: `${veiculoTitle} | Hidrocar Veículos`,
      description: `${veiculoTitle} - ${veiculo.km?.toLocaleString('pt-BR')} KM, ${veiculo.combustivel}, ${veiculo.transmissao}. Confira na Hidrocar Veículos em Aracaju/SE.`,
      image: coverPhoto,
      url: veiculoUrl
    });

    setVehicleJsonLd({
      name: veiculoTitle.trim(),
      brand: veiculo.montadora?.nome || '',
      model: veiculo.modelo?.nome || '',
      year: veiculo.ano_modelo,
      mileage: veiculo.km || 0,
      fuelType: veiculo.combustivel || '',
      transmission: veiculo.transmissao || '',
      price: veiculo.valor_venda || 0,
      image: coverPhoto,
      url: veiculoUrl,
      description: `${veiculoTitle} - ${veiculo.km?.toLocaleString('pt-BR')} KM, ${veiculo.combustivel}, ${veiculo.transmissao}.`,
      sellerName: 'Hidrocar Veículos',
      sellerPhone: empresa?.telefone,
    });

    return () => removeJsonLd();
  }, [veiculo, empresa, id, sortedPhotos]);

  // Redireciona se não encontrar veículo após carregar
  useEffect(() => {
    if (!isLoading && !veiculo && id) {
      navigate('/');
    }
  }, [isLoading, veiculo, id, navigate]);

  const handleNextPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex(prev => {
      const nextIndex = (prev + 1) % sortedPhotos.length;
      setActivePhoto(sortedPhotos[nextIndex].url);
      return nextIndex;
    });
  }, [sortedPhotos]);

  const handlePrevPhoto = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex(prev => {
      const prevIndex = (prev - 1 + sortedPhotos.length) % sortedPhotos.length;
      setActivePhoto(sortedPhotos[prevIndex].url);
      return prevIndex;
    });
  }, [sortedPhotos]);

  // Navegação por teclado no lightbox (setas e Esc)
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleNextPhoto, handlePrevPhoto]);

  // Passagem automática de fotos (Auto-play)
  useEffect(() => {
    if (isFullscreen || isHovered || sortedPhotos.length <= 1) return;

    const interval = setInterval(() => {
      handleNextPhoto();
    }, 4000); // Troca a cada 4 segundos

    return () => clearInterval(interval);
  }, [isFullscreen, isHovered, sortedPhotos.length, handleNextPhoto]);

  const handleWhatsApp = useCallback(() => {
    if (!veiculo || !empresa) return;
    const phone = (empresa.telefone || '').replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Gostaria de mais informações sobre o ${veiculo.montadora?.nome} ${veiculo.modelo?.nome} (${veiculo.ano_modelo}) que vi no site.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  }, [veiculo, empresa]);

  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = useCallback(async () => {
    if (!veiculo) return;
    const title = `${veiculo.montadora?.nome} ${veiculo.modelo?.nome} ${veiculo.ano_modelo}`;
    const url = window.location.href;

    const fallbackCopy = async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
        } else {
          // Fallback legacy (para acessos HTTP ou IPs locais)
          const textArea = document.createElement("textarea");
          textArea.value = url;
          // Evita rolar a tela
          textArea.style.position = "fixed";
          textArea.style.top = "0";
          textArea.style.left = "0";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 3000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Não foi possível copiar o link. Copie a URL do navegador.');
      }
    };

    // Use native share only on mobile platforms where it's robust
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());

    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: title,
          text: `Confira este ${title} na Hidrocar Veículos!`,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard on Desktop
      await fallbackCopy();
    }
  }, [veiculo]);

  if (!veiculo && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500">Veículo não encontrado.</p>
      </div>
    );
  }

  const v = veiculo || {} as IVeiculoPublic;
  const tagsCar = useMemo(
    () => veiculo ? allCaracteristicas.filter(c => veiculo.caracteristicas_ids?.includes(c.id)) : [],
    [veiculo, allCaracteristicas]
  );
  const tagsOp = useMemo(
    () => veiculo ? allOpcionais.filter(o => veiculo.opcionais_ids?.includes(o.id)) : [],
    [veiculo, allOpcionais]
  );
  const corObj = useMemo(
    () => veiculo ? cores.find(c => c.id === veiculo.cor_id) : undefined,
    [veiculo, cores]
  );

  // Se estiver carregando, mostramos o esqueleto mas JÁ COM navbar
  const content = isLoading ? (
    <VehicleDetailsSkeleton />
  ) : (
    <>
      <section className="pt-24 lg:pt-32 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">

          {/* Botão de Voltar */}
          <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 group px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[#004691] transition-all active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#004691] group-hover:bg-[#004691] group-hover:text-white transition-all">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-[#004691] transition-colors">Voltar ao Catálogo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* GALERIA DE FOTOS (CENTRALIZADA E CONTROLADA) */}
            <div
              className="lg:col-span-8 flex flex-col items-center space-y-6 overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >

              {/* 1. CONTAINER DA FOTO PRINCIPAL (FIXO 380x350) */}
              <div className="relative group flex justify-center w-full">
                <div
                  onClick={() => setIsFullscreen(true)}
                  className="w-full max-w-4xl aspect-[4/3] bg-slate-900 rounded-[3rem] overflow-hidden relative border-4 border-white cursor-zoom-in shadow-2xl shrink-0"
                >
                  {activePhoto ? (
                    <img
                      src={activePhoto}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={veiculo ? `${veiculo.montadora?.nome || ''} ${veiculo.modelo?.nome || ''} ${veiculo.ano_modelo || ''}`.trim() : 'Veículo'}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 font-black">MÍDIA INDISPONÍVEL</div>
                  )}

                  {/* Navegação na Foto Principal */}
                  {sortedPhotos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        aria-label="Foto anterior"
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white hover:text-[#004691] transition-all opacity-0 group-hover:opacity-100 z-20"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        aria-label="Próxima foto"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white hover:text-[#004691] transition-all opacity-0 group-hover:opacity-100 z-20"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </>
                  )}

                  <div className="absolute top-6 left-6 bg-[#004691] text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl z-10">
                    HCV SELEÇÃO
                  </div>
                </div>
              </div>

              {/* 2. MINIATURAS (CONTIDAS NA LARGURA DA FOTO) */}
              <div className="w-full max-w-4xl overflow-hidden">
                <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1 scrollbar-hide snap-x">
                  {sortedPhotos.map((foto, index) => (
                    <button
                      key={foto.id}
                      onClick={() => { setActivePhoto(foto.url); setActivePhotoIndex(index); }}
                      className={`relative w-24 h-[60px] rounded-xl overflow-hidden border-2 transition-all snap-start shrink-0 ${activePhoto === foto.url ? 'border-[#004691] shadow-lg scale-105 z-10' : 'border-white opacity-40 hover:opacity-100'
                        }`}
                    >
                      <img src={foto.url} className="w-full h-full object-cover" alt={`${veiculo?.montadora?.nome || ''} ${veiculo?.modelo?.nome || ''} - Foto ${index + 1}`} loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PAINEL DE INFORMAÇÕES (LATERAL) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[3rem] border border-slate-200 p-8 shadow-2xl space-y-8 lg:sticky lg:top-28">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {v.montadora?.logo_url && <img src={v.montadora.logo_url} className="h-8 w-auto object-contain" alt="" />}
                    <span className="text-[11px] font-black text-[#004691] uppercase tracking-[0.4em]">{v.montadora?.nome}</span>
                  </div>
                  <h1 className="text-5xl font-[900] text-slate-900 uppercase tracking-tighter leading-none">{v.modelo?.nome}</h1>
                  <p className="text-lg font-medium text-slate-400 uppercase tracking-tight leading-none border-l-4 border-[#004691] pl-4">{v.versao?.nome}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor do Ativo</p>
                  <p className="text-5xl font-[900] text-[#004691] tracking-tighter">{veiculo ? formatCurrency(veiculo.valor_venda) : 'R$ --'}</p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={handleWhatsApp}
                    className="w-full py-6 bg-[#004691] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-[#00356d] transition-all active:scale-95 flex items-center justify-center group"
                  >
                    <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                    Falar com Especialista
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:border-[#004691] hover:text-[#004691] transition-all active:scale-95 flex items-center justify-center group"
                  >
                    <svg className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.342l7.132-3.566m-7.132 5.066l7.132 3.566M16 5a3 3 0 11-6 0 3 3 0 016 0zm-8 7a3 3 0 11-6 0 3 3 0 016 0zm8 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {shareStatus === 'copied' ? 'Link Copiado!' : 'Compartilhar Veículo'}
                  </button>
                </div>

                {isLoading ? (
                  <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-xl" />
                ) : (
                  <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ano Fab/Mod</p>
                      <p className="text-xl font-black text-slate-900 leading-none">{veiculo?.ano_fabricacao} / {veiculo?.ano_modelo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quilometragem</p>
                      <p className="text-xl font-black text-slate-900 leading-none">{veiculo?.km?.toLocaleString('pt-BR')} <span className="text-[10px]">KM</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Câmbio</p>
                      <p className="text-sm font-black text-slate-900 leading-none uppercase">{veiculo?.transmissao}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Combustível</p>
                      <p className="text-sm font-black text-slate-900 leading-none uppercase">{veiculo?.combustivel}</p>
                    </div>
                    {corObj && (
                      <div className="col-span-2 flex items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                        <div className="w-5 h-5 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: corObj.rgb_hex }}></div>
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Cor {corObj.nome}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTBOX (TELA CHEIA) */}
      {isFullscreen && activePhoto && (
        <div
          className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
          onClick={() => setIsFullscreen(false)}
        >
          <button aria-label="Fechar visualização" className="absolute top-10 right-10 text-white/50 hover:text-white transition-all transform hover:scale-110">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="relative w-full max-w-6xl flex items-center justify-center">
            {sortedPhotos.length > 1 && (
              <button
                onClick={handlePrevPhoto}
                aria-label="Foto anterior"
                className="absolute -left-20 top-1/2 -translate-y-1/2 hidden xl:flex w-16 h-16 bg-white/10 text-white rounded-full items-center justify-center hover:bg-white hover:text-slate-900 transition-all shadow-2xl"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}

            <img
              src={activePhoto}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500"
              alt={veiculo ? `${veiculo.montadora?.nome || ''} ${veiculo.modelo?.nome || ''} - Visualização ampliada` : 'Visualização ampliada'}
              onClick={(e) => e.stopPropagation()}
            />

            {sortedPhotos.length > 1 && (
              <button
                onClick={handleNextPhoto}
                aria-label="Próxima foto"
                className="absolute -right-20 top-1/2 -translate-y-1/2 hidden xl:flex w-16 h-16 bg-white/10 text-white rounded-full items-center justify-center hover:bg-white hover:text-slate-900 transition-all shadow-2xl"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO TÉCNICA (DETALHAMENTO) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">

            <div className="lg:col-span-8 space-y-20">
              {tagsCar.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.5em] mb-10 flex items-center">
                    <span className="w-2 h-8 bg-[#004691] rounded-full mr-5"></span>
                    Destaques de Seleção
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {tagsCar.map(c => (
                      <div key={c.id} className="bg-slate-50 p-6 rounded-[2rem] flex flex-col gap-4 border border-slate-100 hover:border-[#004691] transition-all">
                        <div className="w-10 h-10 bg-[#004691] text-white rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest leading-tight">{c.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tagsOp.length > 0 && (
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.5em] mb-10 flex items-center">
                    <span className="w-2 h-8 bg-slate-300 rounded-full mr-5"></span>
                    Configuração e Itens
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-12">
                    {tagsOp.map(o => (
                      <div key={o.id} className="flex items-center gap-4 py-3 border-b border-slate-50 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#004691]/20 group-hover:bg-[#004691] transition-all"></div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight group-hover:translate-x-1 transition-transform">{o.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {veiculo?.observacoes && (
                <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-10 -mr-40 -mt-40"></div>
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em] mb-12">Dossiê de Procedência</h3>
                  <p className="text-2xl md:text-3xl text-slate-200 font-medium leading-relaxed italic relative z-10 whitespace-pre-wrap">
                    "{veiculo.observacoes}"
                  </p>
                </div>
              )}
            </div>

            {/* SELOS HCV */}
            <div className="lg:col-span-4 space-y-10">
              <div className="bg-[#004691] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                <h4 className="text-2xl font-black uppercase tracking-tighter mb-10">Compromisso HCV</h4>
                <div className="space-y-12">
                  {[
                    { title: 'Certificação Cautelar', desc: 'Estrutura e documentação 100% aprovada.' },
                    { title: 'Revisão Especializada', desc: 'Inspeção rigorosa em mais de 150 itens.' },
                    { title: 'Higienização Premium', desc: 'Estética completa e assepsia hospitalar.' }
                  ].map((selo, i) => (
                    <div key={i} className="flex items-start gap-6">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                        <svg className="w-6 h-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 12l2 2 4-4" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide mb-2">{selo.title}</p>
                        <p className="text-xs text-blue-100/60 leading-relaxed font-medium">{selo.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter'] antialiased">
      <PublicNavbar empresa={empresa || {} as IEmpresa} />

      {content}

      <PublicFooter empresa={empresa || {} as IEmpresa} />
    </div>
  );
};

export default PublicVehicleDetailsPage;
