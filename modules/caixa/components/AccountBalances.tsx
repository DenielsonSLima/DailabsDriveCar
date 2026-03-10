
import React from 'react';
import { IContaBancaria } from '../../ajustes/contas-bancarias/contas.types';

interface Props {
    contas: IContaBancaria[];
}

const AccountBalances: React.FC<Props> = ({ contas }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const totalGeral = contas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0);

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-7 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Saldos das Contas</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Disponibilidade por carteira</p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {contas.map(c => (
                    <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-sm transform group-hover:scale-105 transition-transform"
                                style={{ backgroundColor: c.cor_cartao || '#6366f1' }}
                            >
                                {c.banco_nome ? c.banco_nome.substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1 truncate" title={c.banco_nome}>{c.banco_nome}</h4>
                                {c.titular && (
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1 opacity-80">{c.titular}</p>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1 h-1 rounded-full ${c.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {c.ativo ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-xs font-black text-slate-900">{fmt(c.saldo_atual || 0)}</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Saldo Atual</p>
                        </div>
                    </div>
                ))}

                {contas.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma conta encontrada</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidade Total</span>
                    <p className="text-lg font-black text-indigo-600 tracking-tighter">{fmt(totalGeral)}</p>
                </div>
            </div>
        </div>
    );
};

export default AccountBalances;
