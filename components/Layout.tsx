
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';
import MobileBottomNav from './MobileBottomNav';
import AIAssistant from './AIAssistant';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <div className={`flex flex-col flex-1 transition-all duration-300 md:${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        {/* Padding extra no mobile para evitar sobrepor a tab bar */}
        <main className="p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav 
        onOpenMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        isMenuOpen={isMobileMenuOpen} 
      />

      {/* RAG Memory Assistant */}
      <AIAssistant />
    </div>
  );
};

export default Layout;
