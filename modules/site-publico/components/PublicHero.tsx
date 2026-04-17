import React, { useState, useEffect, useCallback } from 'react';
import { IHeroSlide } from '../../editor-site/editor-site.types';

// Slides padrão (fallback se não houver dados do banco)
const DEFAULT_SLIDES: IHeroSlide[] = [
  {
    image_url: '/hero/banner-1.jpg',
    title: 'A EXPERIÊNCIA DEFINITIVA EM SEMINOVOS',
    subtitle: 'Curadoria rigorosa e transparência absoluta. Onde a confiança encontra o seu próximo carro em Aracaju.'
  },
  {
    image_url: '/hero/banner-2.jpg',
    title: 'NEGOCIAÇÃO INTELIGENTE E SEM BUROCRACIA',
    subtitle: 'Seu usado vale mais aqui. Financiamento acelerado com as taxas mais competitivas do mercado sergipano.'
  },
  {
    image_url: '/hero/banner-3.jpg',
    title: 'PADRÃO SOUZA DE EXCELÊNCIA',
    subtitle: 'Mais que uma venda, um compromisso com a procedência. Cada detalhe verificado por quem entende de verdade.'
  }
];

interface Props {
  slides?: IHeroSlide[];
}

/**
 * Função de limpeza reforçada para garantir que nenhum vestígio da marca antiga apareça.
 * Converte "Hidrocar" ou "HCV" para "Souza Veículos" ou "Souza".
 */
const cleanBranding = (text: string) => {
  if (!text) return text;
  return text
    .replace(/Hidrocar Veículos/gi, 'Souza Veículos')
    .replace(/Hidrocar/gi, 'Souza')
    .replace(/HCV/gi, 'Souza');
};

const PublicHero: React.FC<Props> = ({ slides: propSlides }) => {
  // Aplicando sanitização nos slides que vêm do banco de dados
  const rawSlides = propSlides && propSlides.length > 0 ? propSlides : DEFAULT_SLIDES;
  const slides = rawSlides.map(s => ({
    ...s,
    title: cleanBranding(s.title),
    subtitle: cleanBranding(s.subtitle)
  }));

  const [current, setCurrent] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % slides.length;
        setLoadedSlides(s => new Set(s).add(next));
        return next;
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Pre-carrega o próximo slide
  useEffect(() => {
    const nextIndex = (current + 1) % slides.length;
    setLoadedSlides(s => new Set(s).add(nextIndex));
  }, [current, slides.length]);

  const handleDotClick = useCallback((i: number) => {
    setCurrent(i);
    setLoadedSlides(s => new Set(s).add(i));
  }, []);

  return (
    <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {slides.map((slide, index) => {
        // Só renderiza o slide se já foi carregado (lazy)
        const shouldRender = loadedSlides.has(index);
        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={index !== current}
          >
            {shouldRender && (
              <>
                <img
                  src={slide.image_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt={slide.title}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding={index === 0 ? 'sync' : 'async'}
                  fetchPriority={index === 0 ? 'high' : 'low'}
                />
                {/* Névoa Marinho Black */}
                <div className="absolute inset-0 bg-slate-950/40"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#050a14]/80 via-transparent to-transparent"></div>

                {/* Texto posicionado na parte inferior para não cobrir os carros */}
                <div className="absolute inset-0 z-10 flex items-end pb-20">
                  <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className={`max-w-2xl transition-all duration-1000 ${index === current ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
                      <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 space-y-4">
                        <p className="text-orange-500 text-xs font-black uppercase tracking-[0.5em]">Souza Veículos • Veículos Premium</p>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter uppercase drop-shadow-2xl">
                          {slide.title}
                        </h1>
                        <p className="text-base md:text-lg text-white font-medium max-w-xl leading-relaxed">
                          {slide.subtitle}
                        </p>
                        <div className="pt-2">
                          <a href="#estoque" className="inline-block px-8 py-4 bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-orange-600 transition-all shadow-2xl">
                            Ver Estoque
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Pagination Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDotClick(i)}
            className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-12 bg-white' : 'w-4 bg-white/30'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default React.memo(PublicHero);
