import React from 'react';
import fachadaImg from '../assets/quem-somos-souza.png';
import { ISobreCard } from '../../editor-site/editor-site.types';

// Defaults
const DEFAULT_SUBTITULO = 'Souza Veículos';
const DEFAULT_TITULO = 'Quem Somos.';
const DEFAULT_PARAGRAFOS = [
  'A Souza Veículos é uma empresa especializada na compra e venda de veículos novos e seminovos de alta qualidade. Atuamos com transparência, responsabilidade e compromisso, oferecendo aos nossos clientes segurança e tranquilidade em cada negociação.',
  'Trabalhamos com veículos criteriosamente revisados e com procedência garantida, sempre buscando as melhores oportunidades do mercado para atender com excelência aos nossos clientes.',
  'Mais do que comercializar automóveis, construímos relacionamentos sólidos baseados em confiança, credibilidade e um atendimento personalizado focado na sua satisfação.'
];
const DEFAULT_CARDS: ISobreCard[] = [
  { titulo: 'Qualidade Rigorosa', descricao: 'Garantia de procedência e veículos selecionados com altíssimo padrão.' },
  { titulo: 'Transparência Total', descricao: 'Negociação clara, segura e com suporte especializado.' },
  { titulo: 'Experiência no Ramo', descricao: 'Credibilidade consolidada na comercialização de seminovos de excelência.' },
];

// Ícones SVG inline para os cards
const cardIcons = [
  <svg key="1" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="2" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="3" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
];
const cardBgIcons = [
  <svg key="bg1" className="absolute -right-6 -bottom-6 w-40 h-40 text-white/[0.04] group-hover:text-white/[0.07] transition-colors duration-500 rotate-12 group-hover:rotate-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>,
  <svg key="bg2" className="absolute -right-6 -bottom-6 w-40 h-40 text-white/[0.04] group-hover:text-white/[0.07] transition-colors duration-500 -rotate-12 group-hover:-rotate-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" /></svg>,
  <svg key="bg3" className="absolute -right-6 -bottom-6 w-40 h-40 text-white/[0.04] group-hover:text-white/[0.07] transition-colors duration-500 rotate-12 group-hover:rotate-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" /></svg>,
];

interface Props {
  subtitulo?: string;
  titulo?: string;
  paragrafos?: string[];
  imagemUrl?: string | null;
  cards?: ISobreCard[];
}

const AboutUs: React.FC<Props> = React.memo(({ subtitulo, titulo, paragrafos, imagemUrl, cards }) => {
  const sub = subtitulo || DEFAULT_SUBTITULO;
  const tit = titulo || DEFAULT_TITULO;
  const pars = paragrafos && paragrafos.length > 0 ? paragrafos : DEFAULT_PARAGRAFOS;
  const crds = cards && cards.length > 0 ? cards : DEFAULT_CARDS;
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