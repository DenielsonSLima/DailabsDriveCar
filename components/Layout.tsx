
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';
import MobileBottomNav from './MobileBottomNav';

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

      <div className={`flex min-w-0 flex-col flex-1 transition-[margin-left] duration-200 motion-reduce:transition-none ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'}`}>
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

    </div>
  );
};

export default Layout;
