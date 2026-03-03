import React from 'react';

const TOTAL_SECONDS = 120; // 2 minutos

interface SessionTimeoutModalProps {
    isOpen: boolean;
    countdown: number;
    onContinue: () => void;
    onLogout: () => void;
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
    isOpen,
    countdown,
    onContinue,
    onLogout
}) => {
    if (!isOpen) return null;

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    const timeLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const progress = (countdown / TOTAL_SECONDS) * 100;

    // Cor muda conforme o tempo restante
    const isUrgent = countdown <= 30;
    const barColor = isUrgent ? 'bg-rose-500' : 'bg-indigo-600';
    const iconColor = isUrgent ? 'text-rose-500' : 'text-amber-500';
    const iconBg = isUrgent ? 'bg-rose-50' : 'bg-amber-50';
    const countdownColor = isUrgent ? 'text-rose-600' : 'text-indigo-600';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Barra de progresso */}
                <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
                    <div
                        className={`h-full ${barColor} transition-all duration-1000 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-10 flex flex-col items-center text-center">

                    {/* Ícone animado */}
                    <div className={`w-20 h-20 ${iconBg} rounded-3xl flex items-center justify-center mb-6 ${isUrgent ? 'animate-pulse' : 'animate-bounce'}`}>
                        <svg className={`w-10 h-10 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">
                        Sua sessão está expirando
                    </h2>

                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed mb-2">
                        Por segurança, sua sessão será encerrada por inatividade.
                    </p>

                    {/* Contagem regressiva grande */}
                    <div className={`text-5xl font-black tabular-nums tracking-tighter mt-2 mb-1 ${countdownColor}`}>
                        {timeLabel}
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                        {isUrgent ? '⚠ Logout automático em instantes' : 'Tempo restante para logout automático'}
                    </p>

                    <div className="grid grid-cols-1 w-full gap-3">
                        <button
                            onClick={onContinue}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                        >
                            Continuar Conectado
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-[0.98]"
                        >
                            Sair Agora
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;
