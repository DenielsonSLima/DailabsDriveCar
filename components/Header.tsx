import React from 'react';
import GlobalSearch from './GlobalSearch';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center flex-1 space-x-2 md:space-x-0">
        <button 
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md md:hidden"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <GlobalSearch />
      </div>

      <div className="flex items-center space-x-4">
        {/* Notificações */}
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-rose-500 border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        {/* Perfil Simplificado */}
        <div className="flex items-center space-x-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">Admin Nexus</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Acesso Gestor</p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm border border-indigo-100 shadow-sm">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
