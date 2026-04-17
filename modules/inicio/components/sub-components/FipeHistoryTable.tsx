import React from 'react';
import { History, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FipeHistoryTableProps {
  historico: any[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  formatCurrency: (val: number) => string;
  calculateVariation: (current: number, previous: number) => string | null;
  url?: string;
}

const FipeHistoryTable: React.FC<FipeHistoryTableProps> = ({ 
  historico, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage,
  formatCurrency,
  calculateVariation,
  url
}) => {
  const totalPages = Math.ceil(historico.length / itemsPerPage);
  const paginatedHistory = historico.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="lg:col-span-12 xl:col-span-5 h-full">
      <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm h-full flex flex-col min-h-[380px]">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Histórico de Preços</span>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        
        <div className="flex-1 px-5 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="py-3">Mês/Ano</th>
                <th className="py-3 text-right">Valor</th>
                <th className="py-3 text-right">Var. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedHistory.map((row, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                const nextRow = historico[globalIdx + 1];
                const variation = nextRow ? calculateVariation(row.valor, nextRow.valor) : null;
                const isPositive = variation && parseFloat(variation) > 0;
                const isNegative = variation && parseFloat(variation) < 0;

                return (
                  <tr key={idx} className={`text-[11px] font-bold ${globalIdx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                    <td className="py-3.5 uppercase">{row.mes}</td>
                    <td className="py-3.5 text-right">{formatCurrency(row.valor)}</td>
                    <td className={`py-3.5 text-right flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-300'}`}>
                      {variation ? (
                        <>
                          {variation}% 
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : null}
                        </>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-20 text-slate-400 transition-all border border-transparent hover:border-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-6 h-6 rounded-lg text-[9px] font-black transition-all border ${
                    currentPage === i + 1 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-20 text-slate-400 transition-all border border-transparent hover:border-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FipeHistoryTable;
