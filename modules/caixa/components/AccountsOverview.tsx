
import React from 'react';
import { IContaBancaria } from '../../ajustes/contas-bancarias/contas.types';

interface Props {
  contas: IContaBancaria[];
}

const AccountsOverview: React.FC<Props> = ({ contas }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Disponibilidade</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Saldos por carteira bancária</p>
        </div>
      </div>

      <div className="space-y-3">
        {contas.map(c => (
          <div key={c.id} className="p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-sm transform group-hover:scale-105 transition-transform"
                style={{ backgroundColor: c.cor_cartao || '#1e293b' }}
              >
                {c.banco_nome ? c.banco_nome.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <h4 className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1 truncate max-w-[120px]" title={c.banco_nome}>{c.banco_nome}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">{c.titular || 'CONTA PADRÃO'}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-black text-slate-900">{fmt(c.saldo_atual || 0)}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${c.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {c.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {contas.length === 0 && (
          <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-3xl">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sem contas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsOverview;
