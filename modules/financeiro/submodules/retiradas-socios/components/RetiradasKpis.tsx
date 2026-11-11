
import React from 'react';
import { IRetirada } from '../retiradas.types';

interface Props {
  retiradas: IRetirada[];
  saldosSocios: any[];
}

const RetiradasKpis: React.FC<Props> = ({ retiradas, saldosSocios }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
      {saldosSocios.map(socio => (
        <div key={socio.socio_id} className="bg-slate-50 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <h4 className="text-slate-900 font-semibold text-sm normal-case tracking-normal">{socio.nome}</h4>
              <p className="text-xs text-indigo-600 font-medium normal-case tracking-normal mt-0.5">Saldo Disponível</p>
            </div>
            <div className="bg-slate-100/20 text-slate-600 p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">{formatCurrency(socio.saldo_disponivel)}</h3>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
              <div>
                <p className="text-xs text-emerald-400 font-medium normal-case tracking-normal">Lucro Acumulado</p>
                <p className="text-xs text-slate-900 mt-0.5 font-medium">{formatCurrency(socio.total_lucro_vendas + socio.total_creditos_distribuidos)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-500 font-medium normal-case tracking-normal">Já Retirado</p>
                <p className="text-xs text-slate-900 mt-0.5 font-medium">{formatCurrency(socio.total_retiradas)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RetiradasKpis;
