import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FinanceiroService } from '../../financeiro.service';
import { IHistoricoUnificado, IHistoricoTotals, IHistoricoFiltros } from '../../financeiro.types';
import ExtratoTable from './components/ExtratoTable';
import ExtratoKpis from './components/ExtratoKpis';
import ExtratoFilters from './components/ExtratoFilters';

const ExtratoPage: React.FC = () => {
  const [items, setItems] = useState<IHistoricoUnificado[]>([]);
  const [totals, setTotals] = useState<IHistoricoTotals>({
    entradas_realizadas: 0, saidas_realizadas: 0,
    a_pagar_pendente: 0, a_receber_pendente: 0, saldo_periodo: 0
  });

  // Paginação
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 30;

  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<IHistoricoFiltros>({
    dataInicio: '', dataFim: '', tipo: '', status: '', origem: '', busca: ''
  });

  // Debounce para busca por texto
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [listRes, totalsRes] = await Promise.all([
        FinanceiroService.getHistoricoGeral({
          ...filtros,
          page: currentPage,
          limit: ITEMS_PER_PAGE
        }),
        FinanceiroService.getHistoricoTotals(filtros)
      ]);

      setItems(listRes.data);
      setTotalPages(listRes.totalPages);
      setTotalCount(listRes.count);
      setTotals(totalsRes);
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filtros, currentPage]);

  useEffect(() => {
    loadData();
    const sub = FinanceiroService.subscribeToTable('fin_transacoes', () => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [loadData]);

  // Reset página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros]);

  const handleFiltrosChange = (newFiltros: IHistoricoFiltros) => {
    // Debounce no campo de busca
    if (newFiltros.busca !== filtros.busca) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFiltros(newFiltros);
      }, 400);
    } else {
      setFiltros(newFiltros);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['Data', 'Descrição', 'Parceiro', 'Tipo', 'Status', 'Origem', 'Pedido', 'Forma', 'Parcela', 'Valor'];
    const formatCurrency = (v: number) => v.toFixed(2).replace('.', ',');
    const rows = items.map(h => [
      h.data, h.descricao, h.parceiro_nome || '', h.tipo_movimento, h.status,
      h.origem, h.pedido_ref || '', h.forma_pagamento || '', h.parcela_info || '',
      formatCurrency(h.source === 'TITULO' ? (h.valor_restante || h.valor) : h.valor)
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-20">

      {/* 1. KPIs do Período */}
      <ExtratoKpis totals={totals} />

      {/* 2. Filtros de Auditoria */}
      <ExtratoFilters filtros={filtros} onChange={handleFiltrosChange} />

      {/* 3. Tabela Unificada */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Histórico Geral de Movimentações</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              Todas as entradas, saídas, contas a pagar e a receber — compras, vendas, despesas e transferências
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            Exportar para CSV
          </button>
        </div>

        <div className="p-0">
          <ExtratoTable items={items} loading={loading} />
        </div>

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Página <span className="text-slate-900">{currentPage}</span> de <span className="text-slate-900">{totalPages}</span>
              <span className="ml-2 opacity-50">({totalCount} registros)</span>
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button className="w-8 h-8 rounded-lg text-[10px] font-black bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center">
                {currentPage}
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtratoPage;