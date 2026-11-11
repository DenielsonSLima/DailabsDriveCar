import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  title: string;
  children: React.ReactNode;
}

const QuickPreviewModal: React.FC<Props> = ({ isOpen, onClose, onDownload, title, children }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      data-drivecar-ui className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-sm flex flex-col no-print animate-in fade-in duration-300"
      style={{ width: '100vw', height: '100dvh', minHeight: '100dvh' }}
    >
      
      {/* Top Toolbar */}
      <div className="min-h-20 bg-slate-900 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 shrink-0">
        <div className="flex items-center space-x-4">
           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
           </div>
           <div>
              <h3 className="text-white font-semibold normal-case text-sm tracking-normal">{title}</h3>
              <p className="text-slate-400 text-xs font-bold normal-case tracking-normal">Visualização Pré-Impressão</p>
           </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={onDownload}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Baixar PDF / Imprimir</span>
          </button>
          
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Document Area */}
      <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-6 flex justify-start md:justify-center bg-slate-800/50">
        <div className="bg-white shadow-sm rounded-sm w-[210mm] min-w-[210mm] min-h-[297mm] shrink-0 origin-top">
           <div id="print-content">
             {children}
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="h-10 bg-slate-900 border-t border-white/5 flex items-center justify-center">
         <p className="text-xs font-bold text-slate-500 normal-case tracking-normal">HCV Operating System - Document Generator v4.0</p>
      </div>
    </div>,
    document.body
  );
};

export default QuickPreviewModal;
