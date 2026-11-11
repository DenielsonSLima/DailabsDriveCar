
import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info'; // Danger para exclusão (vermelho), Info para outras ações (azul/indigo)
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false
}) => {
  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div data-drivecar-ui role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="bg-white w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          {/* Ícone */}
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm ${variant === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
            }`}>
            {variant === 'danger' ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <h3 className="text-xl font-semibold text-slate-900 normal-case tracking-tight mb-2">
            {title}
          </h3>

          <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
            {message}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 text-white rounded-xl text-xs font-semibold normal-case tracking-normal shadow-lg transition-all flex items-center justify-center disabled:opacity-50 ${variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-none'
              }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ConfirmModal;
