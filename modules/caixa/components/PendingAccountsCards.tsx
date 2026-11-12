import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaixaService } from '../caixa.service';
import { IPendingAccount } from '../caixa.types';

interface Props {
  startDate: string;
  endDate: string;
}

const PendingAccountsCards: React.FC<Props> = ({ startDate, endDate }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['caixa_contas_pendentes', startDate, endDate],
    queryFn: () => CaixaService.getContasPendentes(startDate, endDate),
  });

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const fmtDate = (d: string) => {
    // Handling timezone issues by adding time to YYYY-MM-DD
    const date = new Date(d.includes('T') ? d : `${d}T12:00:00`);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="dc-panel h-64"></div>
        <div className="dc-panel h-64"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 text-center">
        <p className="text-rose-600 font-semibold text-xs">Erro ao carregar contas pendentes</p>
      </div>
    );
  }

  const contasPagar = (data || []).filter(t => t.tipo === 'PAGAR');
  const contasReceber = (data || []).filter(t => t.tipo === 'RECEBER');

  const renderTable = (items: IPendingAccount[], emptyMsg: string, isDebito: boolean) => {
    const totalPendente = items.reduce((acc, c) => acc + ((c.valor_total || 0) + (c.valor_acrescimo || 0) - (c.valor_pago || 0) - (c.valor_desconto || 0)), 0);

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="pb-3 px-4 font-semibold text-xs text-slate-500 normal-case tracking-normal whitespace-nowrap">Data</th>
                <th className="pb-3 px-4 font-semibold text-xs text-slate-500 normal-case tracking-normal">Descrição</th>
                <th className="pb-3 px-4 font-semibold text-xs text-slate-500 normal-case tracking-normal whitespace-nowrap hidden sm:table-cell">Veículo</th>
                <th className="pb-3 px-4 font-semibold text-xs text-slate-500 normal-case tracking-normal text-right whitespace-nowrap">Aberto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const pendente = (item.valor_total || 0) + (item.valor_acrescimo || 0) - (item.valor_pago || 0) - (item.valor_desconto || 0);
                const venc = new Date(item.data_vencimento.includes('T') ? item.data_vencimento : `${item.data_vencimento}T12:00:00`);
                const isAtrasado = item.status === 'ATRASADO' || (venc < new Date() && pendente > 0);

                return (
                  <tr key={item.id} className="group">
                    <td className="px-4 py-3 bg-slate-50 border-y border-l border-slate-100 rounded-l-2xl group-hover:bg-white transition-colors">
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${isAtrasado ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                         <span className={`text-xs font-bold tracking-normal whitespace-nowrap ${isAtrasado ? 'text-rose-600' : 'text-slate-600'}`}>{fmtDate(item.data_vencimento)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-colors">
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1" title={item.descricao}>{item.descricao}</p>
                    </td>
                    <td className="px-4 py-3 bg-slate-50 border-y border-slate-100 group-hover:bg-white transition-colors hidden sm:table-cell">
                      {item.veiculo ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700 leading-tight normal-case tracking-normal truncate max-w-[120px]" title={item.veiculo.modelo}>{item.veiculo.modelo}</span>
                          <span className="text-xs font-semibold text-slate-400 normal-case">{item.veiculo.placa}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-semibold normal-case">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 bg-slate-50 border-y border-r border-slate-100 rounded-r-2xl group-hover:bg-white transition-colors text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                         <span className={`text-xs font-semibold ${isDebito ? 'text-rose-600' : 'text-emerald-600'}`}>
                           {fmt(pendente)}
                         </span>
                         {item.valor_pago > 0 && (
                            <span className="text-xs font-semibold text-slate-400 normal-case mt-0.5">Pago: {fmt(item.valor_pago)}</span>
                         )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-semibold normal-case tracking-normal bg-slate-50 rounded-2xl border border-slate-100">
                    {emptyMsg}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Total Aberto</span>
          <p className={`text-lg font-semibold tracking-normal ${isDebito ? 'text-rose-600' : 'text-emerald-600'}`}>
            {fmt(totalPendente)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contas a Pagar (Débitos) */}
      <div className="dc-panel flex flex-col h-full overflow-hidden">
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-semibold text-slate-900 normal-case tracking-normal flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>
                    Contas a Pagar
                </h3>
                <p className="text-xs text-slate-400 font-semibold normal-case mt-1.5 tracking-normal">Débitos pendentes do período</p>
            </div>
            {contasPagar.length > 0 && (
              <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-semibold normal-case tracking-normal">
                  {contasPagar.length} {contasPagar.length === 1 ? 'Pendente' : 'Pendentes'}
              </div>
            )}
        </div>
        <div className="flex-1">
            {renderTable(contasPagar, 'Nenhuma conta a pagar no período', true)}
        </div>
      </div>

      {/* Contas a Receber (Créditos) */}
      <div className="dc-panel flex flex-col h-full overflow-hidden">
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-semibold text-slate-900 normal-case tracking-normal flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </div>
                    Contas a Receber
                </h3>
                <p className="text-xs text-slate-400 font-semibold normal-case mt-1.5 tracking-normal">Créditos pendentes do período</p>
            </div>
            {contasReceber.length > 0 && (
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold normal-case tracking-normal">
                  {contasReceber.length} a Receber
              </div>
            )}
        </div>
        <div className="flex-1">
            {renderTable(contasReceber, 'Nenhuma conta a receber no período', false)}
        </div>
      </div>
    </div>
  );
};

export default PendingAccountsCards;
