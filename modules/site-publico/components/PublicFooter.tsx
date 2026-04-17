import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IEmpresa } from '../../ajustes/empresa/empresa.types';
import { useScrollToSection } from '../hooks/useScrollToSection';

interface Props {
  empresa: IEmpresa;
}

const PublicFooter: React.FC<Props> = ({ empresa }) => {
  const navigate = useNavigate();
  const handleScroll = useScrollToSection(100);

  return (
    <footer className="bg-[#050a14] text-white pt-10 pb-0 overflow-hidden relative">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600 rounded-full blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-50 rounded-full blur-[120px] opacity-5 translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Coluna 1: Branding */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-white p-2 rounded-xl shadow-lg transform group-hover:rotate-6 transition-transform">
                <img src="/logos/souza-veiculos-logo.png" alt="Souza Veículos" className="w-12 h-12 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-[900] tracking-tighter uppercase text-white leading-none">
                  Souza
                </span>
                <span className="text-2xl font-[900] tracking-tighter uppercase leading-none bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  VEÍCULOS
                </span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Especialistas em veículos premium e seminovos de alta qualidade. Tradição e confiança em cada negociação.
            </p>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-6">Explorar</h4>
            <ul className="space-y-3">
              {[
                { label: 'Estoque', to: '/estoque-publico', type: 'link' },
                { label: 'Quem Somos', to: 'sobre', type: 'scroll' },
                { label: 'Localização', to: 'localizacao', type: 'scroll' },
                { label: 'Contato', to: 'contato', type: 'scroll' }
              ].map((link) => (
                <li key={link.label}>
                  {link.type === 'link' ? (
                    <Link
                      to={link.to}
                      className="text-[10px] font-bold uppercase tracking-widest text-blue-100/60 hover:text-white flex items-center group transition-colors"
                    >
                      <span className="w-0 h-0.5 bg-orange-500 mr-0 transition-all group-hover:w-2 group-hover:mr-2"></span>
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={`#${link.to}`}
                      onClick={(e) => handleScroll(e, link.to)}
                      className="text-[10px] font-bold uppercase tracking-widest text-blue-100/60 hover:text-white flex items-center group transition-colors cursor-pointer"
                    >
                      <span className="w-0 h-0.5 bg-blue-400 mr-0 transition-all group-hover:w-2 group-hover:mr-2"></span>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Localização */}
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-6">Nossa Loja</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 text-blue-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <p className="text-[10px] font-medium text-blue-100/80 leading-relaxed uppercase tracking-wider">
                  Rua Lions Club, 526<br />
                  Atalaia<br />
                  Aracaju / SE
                </p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Rua+Lions+Club+526+Atalaia+Aracaju+SE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[9px] font-bold text-orange-500 hover:text-white uppercase tracking-widest border-b border-orange-500/20 pb-0.5"
              >
                Abrir no Google Maps
              </a>
            </div>
          </div>

          {/* Coluna 4: Atendimento */}
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 mb-6">Atendimento</h4>
            <div className="space-y-4">
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold text-blue-100/40 uppercase tracking-widest">Comercial</p>
                <p className="text-lg font-black text-white tracking-tight leading-none">{empresa?.telefone || '(79) 99119-2361'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold text-blue-100/40 uppercase tracking-widest">E-mail</p>
                <p className="text-[10px] font-medium text-blue-100/80 lowercase tracking-wide">{empresa?.email || 'contato@souzaveiculos.com.br'}</p>
              </div>
              <div className="pt-1 flex items-center space-x-1.5">
                {(() => {
                  const now = new Date();
                  const hour = now.getHours();
                  const day = now.getDay(); // 0=dom, 6=sab
                  const isOpen = day >= 1 && day <= 5 ? (hour >= 8 && hour < 18) : day === 6 ? (hour >= 8 && hour < 13) : false;
                  return isOpen ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Loja Aberta Agora</span>
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Fechado no Momento</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar - Mais Fino e Escuro */}
      <div className="bg-[#00050a] py-4 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Copyright e CNPJ à Esquerda */}
          <div className="text-center md:text-left space-y-0.5">
            <p className="text-white text-[10px] font-bold uppercase tracking-[0.15em]">
              © {new Date().getFullYear()} Souza Veículos
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <p className="text-slate-500 text-[8px] font-medium uppercase tracking-[0.2em]">
                Todos os Direitos Reservados.
              </p>
              <span className="hidden sm:inline text-slate-800">•</span>
              <p className="text-white text-[8px] font-bold uppercase tracking-widest">CNPJ: {empresa?.cnpj ? empresa.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : '01.463.619/0001-03'}</p>
            </div>
          </div>

          {/* CRÉDITOS DAILABS À DIREITA */}
          <div className="opacity-40 group cursor-default hover:opacity-100 transition-all flex items-center space-x-2">
            <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-blue-100/50">Developed by</span>
            <div className="flex items-center space-x-2">
              <img src="/logos/dailabs_logo.png" alt="Dailabs" className="h-5 w-auto brightness-0 invert" />
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-black uppercase tracking-tighter text-white">DAILABS</span>
                <span className="text-[5px] font-bold uppercase tracking-widest text-blue-400">Creative AI & Softwares</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;