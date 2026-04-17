import React from 'react';
import { Car, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { FipeUsageStats } from '../../../ajustes/consulta-placa/consulta-placa.service';

interface FipeSearchFormProps {
  placa: string;
  setPlaca: (placa: string) => void;
  loading: boolean;
  onConsult: () => void;
  stats: FipeUsageStats | null;
  errorStatus: string | null;
}

const FipeSearchForm: React.FC<FipeSearchFormProps> = ({ 
  placa, 
  setPlaca, 
  loading, 
  onConsult, 
  stats,
  errorStatus 
}) => {
  return (
    <div className="max-w-md mx-auto py-10 space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">QUAL A PLACA?</h2>
        <p className="text-xs text-slate-400 font-medium">Consulte Fipe, Chassi e Histórico.</p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-30 transition duration-700"></div>
        <div className="relative flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-lg">
          <div className="relative flex-1">
            <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              disabled={loading || (stats?.remaining === 0)}
              autoFocus
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && onConsult()}
              placeholder="ABC1D23"
              className="w-full bg-slate-50 border-none rounded-xl py-4 pl-11 pr-4 text-xl font-black text-slate-900 placeholder:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 transition-all uppercase font-mono"
            />
          </div>
          <button 
            disabled={loading || !placa || stats?.remaining === 0}
            onClick={onConsult}
            className="bg-slate-900 hover:bg-black disabled:opacity-50 text-white px-6 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-2 active:scale-95"
          >
            Analisar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorStatus && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100 animate-in shake duration-500">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shrink-0" />
          <div>
            <p className="text-[10px] font-black text-rose-700 uppercase tracking-tight">Erro na Consulta</p>
            <p className="text-[11px] font-medium text-rose-600/80 leading-tight">
              {errorStatus}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/30">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
        <p className="text-[9px] font-medium text-indigo-700/80 leading-tight uppercase tracking-tight">
          Smart Cache Ativado: Consultas repetidas <span className="text-indigo-900 font-bold">não descontam do seu limite.</span>
        </p>
      </div>
    </div>
  );
};

export default FipeSearchForm;
