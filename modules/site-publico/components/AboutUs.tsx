import React from 'react';
import fachadaImg from '../assets/quem-somos-souza.jpg';
import { ISobreCard } from '../../editor-site/editor-site.types';

// Defaults otimizados para Souza Veículos
const DEFAULT_SUBTITULO = 'Souza Veículos';
const DEFAULT_TITULO = 'Quem Somos.';
const DEFAULT_PARAGRAFOS = [
  'A Souza Veículos é referência no mercado automotivo, oferecendo uma seleção exclusiva de veículos novos e seminovos que unem qualidade, procedência e o melhor custo-benefício.',
  'Nossa missão é transformar o sonho do carro novo em uma experiêcia segura e prazerosa. Atuamos com transparência total em cada negociação, garantindo que você faça o melhor negócio com total tranquilidade.',
  'Com um atendimento personalizado e foco na satisfação do cliente, a Souza Veículos consolidou sua marca baseada na confiança e na excelência de seus serviços em toda a região.'
];

const DEFAULT_CARDS: ISobreCard[] = [
  { titulo: 'Tradição e Segurança', descricao: 'Garantia de procedência e veículos selecionados com altíssimo padrão.' },
  { titulo: 'Cada Negociação', descricao: 'Atendimento único e focado na melhor oportunidade para você.' },
  { titulo: 'Experiência Souza', descricao: 'Qualidade e transparência em cada detalhe da sua compra.' },
];

// Ícones SVG inline para os cards
const cardIcons = [
  <svg key="1" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="2" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="3" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
];

interface Props {
  subtitulo?: string;
  titulo?: string;
  paragrafos?: string[];
  imagemUrl?: string | null;
  cards?: ISobreCard[];
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

const AboutUs: React.FC<Props> = React.memo(({ subtitulo, titulo, paragrafos, imagemUrl, cards }) => {
  // Aplicando limpeza profunda
  const sub = cleanBranding(subtitulo || DEFAULT_SUBTITULO);
  const tit = cleanBranding(titulo || DEFAULT_TITULO);
  
  const rawPars = paragrafos && paragrafos.length > 0 ? paragrafos : DEFAULT_PARAGRAFOS;
  const pars = rawPars.map(p => cleanBranding(p));

  const rawCrds = cards && cards.length > 0 ? cards : DEFAULT_CARDS;
  const crds = rawCrds.map(c => ({
    titulo: cleanBranding(c.titulo),
    descricao: cleanBranding(c.descricao)
  }));

  // Usa a imagem do banco se existir, senão usa a fachada local
  const imgSrc = imagemUrl || fachadaImg;

  // Separar título para colorir a última palavra
  const titleParts = tit.split(' ');
  const lastWord = titleParts.pop() || '';
  const firstWords = titleParts.join(' ');

  return (
    <section id="sobre" className="py-20 bg-white relative overflow-hidden scroll-mt-32">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Cabeçalho da Seção */}
        <div className="mb-10 space-y-4">
          <span className="inline-block text-orange-500 text-[10px] font-black uppercase tracking-[0.6em] border-b-2 border-orange-600 pb-2">{sub}</span>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">
            {firstWords} <span className="text-orange-500">{lastWord}</span>
          </h2>
        </div>

        {/* Conteúdo Principal + Imagem */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch mb-20">
          <div className="space-y-6 text-lg text-slate-700 font-medium leading-relaxed flex flex-col justify-center">
            {pars.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="relative w-full h-full min-h-[320px]">
            <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-slate-50">
              {/* Imagem Institucional (Fachada) */}
              <img src={imgSrc} className="w-full h-full object-cover" alt="Fachada" />
            </div>
          </div>
        </div>

        {/* Cards de Destaque - Design Dark Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {crds.map((card, i) => (
            <div
              key={i}
              className="bg-[#050a14] p-10 rounded-2xl border-l-[6px] border-orange-500 shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6 hover:shadow-[0_20px_50px_rgba(249,115,22,0.15)] transition-all duration-500 group flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  {cardIcons[i % cardIcons.length]}
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter group-hover:text-orange-500 transition-colors">
                    {card.titulo}
                  </h4>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">
                    {card.descricao}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

AboutUs.displayName = 'AboutUs';

export default AboutUs;