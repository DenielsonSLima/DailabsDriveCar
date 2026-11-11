
import React from 'react';
import { IContaBancaria } from '../../ajustes/contas-bancarias/contas.types';

interface Props {
    contas: IContaBancaria[];
}

const AccountBalances: React.FC<Props> = ({ contas }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const totalGeral = contas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 normal-case tracking-normal">Saldos das Contas</h3>
                <p className="text-xs text-slate-400 font-bold normal-case mt-1 tracking-normal">Disponibilidade por carteira</p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {contas.map(c => (
                    <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs shadow-sm transform group-hover:scale-105 transition-transform"
                                style={{ backgroundColor: c.cor_cartao || '#6366f1' }}
                            >
                                {c.banco_nome ? c.banco_nome.substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[11px] font-semibold text-slate-900 normal-case leading-none mb-1 truncate" title={c.banco_nome}>{c.banco_nome}</h4>
                                {c.titular && (
                                    <p className="text-xs font-bold text-slate-500 normal-case tracking-normal mb-1 opacity-80">{c.titular}</p>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1 h-1 rounded-full ${c.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <span className="text-xs font-bold text-slate-400 normal-case tracking-normal">
                                        {c.ativo ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-xs font-semibold text-slate-900">{fmt(c.saldo_atual || 0)}</p>
                            <p className="text-[7px] font-bold text-slate-400 normal-case tracking-normal mt-0.5">Saldo Atual</p>
                        </div>
                    </div>
                ))}

                {contas.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                        <p className="text-xs font-semibold text-slate-300 normal-case tracking-normal">Nenhuma conta encontrada</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Disponibilidade Total</span>
                    <p className="text-lg font-semibold text-indigo-600 tracking-normal">{fmt(totalGeral)}</p>
                </div>
            </div>
        </div>
    );
};

export default AccountBalances;
