import React, { useEffect, useState } from 'react';
import { AuthService } from '../auth.service';
import { useAuthStore } from '../../../store/auth.store';

const GoogleAccountLinkCard: React.FC = () => {
  const { session } = useAuthStore();
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    AuthService.getUserIdentities()
      .then((identities) => {
        if (!mounted) return;
        setIsLinked(identities.some((identity) => identity.provider === 'google'));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Não foi possível verificar a conta Google.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLinkGoogle = async () => {
    setLinking(true);
    setError(null);
    try {
      await AuthService.linkGoogleAccount();
    } catch (err: any) {
      setError(err.message || 'Não foi possível iniciar o vínculo com Google.');
      setLinking(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.23c0-.79-.07-1.55-.2-2.23H12v4.22h5.37a4.6 4.6 0 01-1.99 3.02v2.51h3.23c1.89-1.74 2.99-4.31 2.99-7.52z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.23-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A9.99 9.99 0 0012 22z" />
            <path fill="#FBBC05" d="M6.4 13.88A6 6 0 016.08 12c0-.65.11-1.28.32-1.88V7.53H3.06A9.99 9.99 0 002 12c0 1.61.39 3.14 1.06 4.47l3.34-2.59z" />
            <path fill="#EA4335" d="M12 6c1.47 0 2.79.51 3.82 1.5l2.86-2.86C16.95 3.03 14.69 2 12 2a9.99 9.99 0 00-8.94 5.53l3.34 2.59C7.19 7.76 9.4 6 12 6z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Conta Google</h3>
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${isLinked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              {loading ? 'Verificando' : isLinked ? 'Vinculada' : 'Opcional'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            {isLinked
              ? 'Seu login também pode ser feito com a conta Google vinculada.'
              : `Vincule ${session?.user.email || 'seu e-mail'} para entrar no sistema com Google.`}
          </p>
          {error && <p className="text-[11px] text-rose-600 font-bold mt-2">{error}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLinkGoogle}
        disabled={loading || linking || isLinked}
        className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 whitespace-nowrap"
      >
        {linking ? 'Abrindo Google...' : isLinked ? 'Já Vinculada' : 'Vincular Google'}
      </button>
    </div>
  );
};

export default GoogleAccountLinkCard;
