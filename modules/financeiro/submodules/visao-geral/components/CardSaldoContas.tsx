import React from 'react';
import { IContaBancaria } from '../../../../ajustes/contas-bancarias/contas.types';

interface Props {
  contas: IContaBancaria[];
  isLoading?: boolean;
}

const CardSaldoContas: React.FC<Props> = ({ contas, isLoading = false }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm h-full">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Disponibilidade por Carteira</h3>
        <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Gerenciar Contas</button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Skeletons de Loading
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-10 rounded-full bg-slate-200"></div>
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
            <p className="text-xs font-bold text-slate-400 uppercase">Nenhuma conta ativa</p>
          </div>
        ) : (
          contas.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group">
              <div className="flex items-center space-x-4">
                <div
                  className="w-2 h-10 rounded-full shadow-sm"
                  style={{ backgroundColor: item.cor_cartao || '#cbd5e1' }}
                ></div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{item.banco_nome}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Ag {item.agencia} CC {item.conta}</p>
                </div>
              </div>
              <p className="text-lg font-black text-slate-900">
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
