import React from 'react';
import { IContaBancaria } from '../../../../ajustes/contas-bancarias/contas.types';

interface Props {
  contas: IContaBancaria[];
  isLoading?: boolean;
}

const CardSaldoContas: React.FC<Props> = ({ contas, isLoading = false }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="text-sm font-semibold text-slate-600 normal-case tracking-normal">Disponibilidade por Carteira</h3>
        <button className="text-xs font-semibold text-indigo-600 normal-case hover:underline">Gerenciar Contas</button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Skeletons de Loading
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-2 h-10 shrink-0 rounded-full bg-slate-200"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                  <div className="h-3 w-32 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded"></div>
            </div>
          ))
        ) : contas.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-xs font-medium text-slate-500 normal-case">Nenhuma conta ativa</p>
          </div>
        ) : (
          contas.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="w-2 h-10 shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: item.cor_cartao || '#cbd5e1' }}
                ></div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 break-words normal-case tracking-tight">{item.banco_nome}</p>
                  <p className="text-xs text-slate-500 font-mono break-all">Ag {item.agencia} CC {item.conta}</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-slate-900 break-words">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.saldo_atual || 0)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CardSaldoContas;
