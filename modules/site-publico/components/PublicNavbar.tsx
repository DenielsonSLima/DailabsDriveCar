
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { IEmpresa } from '../../ajustes/empresa/empresa.types';
import { useScrollToSection } from '../hooks/useScrollToSection';

interface Props {
  empresa: IEmpresa;
}

const PublicNavbar: React.FC<Props> = ({ empresa }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollToSection = useScrollToSection(140);

  // Fecha menu mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Bloqueia scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    scrollToSection(e, id, () => setMobileOpen(false));
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[120] bg-[#050a14] shadow-2xl transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 lg:h-24 flex items-center justify-between">
        {/* Logo à Esquerda */}
        <button
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate('/');
            }
          }}
          aria-label="Ir para página inicial"
          className="flex items-center space-x-3 sm:space-x-4 cursor-pointer group bg-transparent border-none focus:outline-none"
        >
          <div className="bg-white rounded-xl transform group-hover:rotate-6 transition-transform shadow-lg overflow-hidden flex items-center justify-center w-[52px] h-[52px] sm:w-[72px] sm:h-[72px]">
            <img src="/logos/souza-veiculos-logo.png" alt="Souza Veículos" className="w-full h-full object-contain scale-[1.25]" />
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline md:gap-1">
            <span className="text-xl sm:text-2xl font-[900] tracking-tighter uppercase text-white leading-none">
              Souza
            </span>
            <span className="text-xl sm:text-2xl font-[900] tracking-tighter uppercase bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent leading-none">
              VEÍCULOS
            </span>
          </div>
        </button>

        {/* Menu Centralizado - Desktop */}
        <div className="hidden lg:flex items-center space-x-10">
          <button
            onClick={() => {
              if (location.pathname === '/estoque-publico') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/estoque-publico');
              }
            }}
            className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-blue-50 hover:text-white transition-all relative group cursor-pointer bg-transparent border-none focus:outline-none"
          >
            Estoque
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
          </button>
          <a href="#" onClick={(e) => handleScroll(e, 'sobre')} className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-blue-50 hover:text-white transition-all relative group">
            Quem Somos
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
          </a>
          <a href="#" onClick={(e) => handleScroll(e, 'localizacao')} className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-blue-50 hover:text-white transition-all relative group">
            Localização
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
          </a>
          <a href="#" onClick={(e) => handleScroll(e, 'contato')} className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-blue-50 hover:text-white transition-all relative group">
            Contato
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
          </a>
        </div>

        {/* Ações à Direita */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:flex items-center space-x-2 text-[9px] font-black text-blue-200 uppercase tracking-widest hover:text-white transition-colors border border-blue-400/30 px-4 py-2 rounded-xl"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span>Área Restrita</span>
          </button>

          {/* Botão Hamburger - Mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col items-center justify-center w-10 h-10 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
            aria-label="Abrir menu"
          >
            <span className={`block w-5 h-0.5 bg-slate-200 rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3px]' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-200 rounded mt-1 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-200 rounded mt-1 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menu Mobile - Overlay + Painel */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[119] lg:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Painel Mobile */}
      <div
        className={`fixed top-20 left-0 right-0 z-[121] lg:hidden bg-[#050a14]/98 backdrop-blur-2xl border-t border-slate-800 shadow-2xl transition-all duration-400 ${mobileOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col space-y-1">
          <button
            onClick={() => {
              setMobileOpen(false);
              if (location.pathname === '/estoque-publico') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/estoque-publico');
              }
            }}
            className="flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group w-full bg-transparent border-none text-left focus:outline-none"
          >
            <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-slate-300 group-hover:text-white">Estoque</span>
          </button>

          <a
            href="#"
            onClick={(e) => handleScroll(e, 'sobre')}
            className="flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-blue-800/30 transition-colors group"
          >
            <svg className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-blue-50 group-hover:text-white">Quem Somos</span>
          </a>

          <a
            href="#"
            onClick={(e) => handleScroll(e, 'localizacao')}
            className="flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-blue-800/30 transition-colors group"
          >
            <svg className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-blue-50 group-hover:text-white">Localização</span>
          </a>

          <a
            href="#"
            onClick={(e) => handleScroll(e, 'contato')}
            className="flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-blue-800/30 transition-colors group"
          >
            <svg className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="font-['Outfit'] text-sm font-bold uppercase tracking-widest text-blue-50 group-hover:text-white">Contato</span>
          </a>

          {/* Área Restrita - visível no mobile também */}
          <div className="pt-3 mt-2 border-t border-blue-400/20">
            <button
              onClick={() => { setMobileOpen(false); navigate('/login'); }}
              className="flex items-center justify-center space-x-2 w-full text-[10px] font-black text-blue-200 uppercase tracking-widest hover:text-white transition-colors border border-blue-400/30 px-4 py-3 rounded-xl hover:bg-blue-800/30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Área Restrita</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
