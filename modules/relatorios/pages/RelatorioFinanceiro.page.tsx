import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import FinanceiroTemplate from '../templates/financeiro/FinanceiroTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { FinanceiroService } from '../../financeiro/financeiro.service';

const RelatorioFinanceiroPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const [dataInicio, setDataInicio] = useState(firstDay.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(now.toISOString().split('T')[0]);
  const [tipoFluxo, setTipoFluxo] = useState('');

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        EmpresaService.getDadosEmpresa().then(setEmpresa),
        MarcaDaguaService.getConfig().then(setWatermark)
      ]);
      fetchData();
    };
    init();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filtros: any = {};
      if (dataInicio) filtros.dataInicio = dataInicio;
      if (dataFim) filtros.dataFim = dataFim;
      if (tipoFluxo) filtros.tipo = tipoFluxo;

      const [totals, historico] = await Promise.all([
        FinanceiroService.getHistoricoTotals(filtros),
        FinanceiroService.getHistoricoGeral({ ...filtros, limit: 100 }) // Limitado para performance inline
      ]);

      const items = (historico.data || []).map((h: any) => ({
        data: new Date(h.data).toLocaleDateString('pt-BR'),
        descricao: h.descricao,
        categoria: h.parceiro_nome || h.origem || '—',
        conta: h.conta_nome || '—',
        tipo: h.tipo_movimento === 'ENTRADA' || h.tipo_movimento === 'A_RECEBER' ? 'ENTRADA' : 'SAIDA',
        valor: h.valor,
        status: h.status
      }));

      setReportData({
        periodo: `${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        totalEntradas: totals.entradas_realizadas + totals.a_receber_pendente,
        totalSaidas: totals.saidas_realizadas + totals.a_pagar_pendente,
        entradasRealizadas: totals.entradas_realizadas,
        saidasRealizadas: totals.saidas_realizadas,
        aPagar: totals.a_pagar_pendente,
        aReceber: totals.a_receber_pendente,
        items
      });
    } catch (err) {
      console.error('Erro ao gerar relatório financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCur = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="dc-page pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/relatorios')}
            className="dc-button bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
          >
            <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <p className="text-xs font-semibold text-rose-500 normal-case tracking-normal">Relatórios / Gestão</p>
            <h1 className="dc-page-title">Movimentação Financeira</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="dc-button flex items-center space-x-2 bg-slate-900 text-white normal-case tracking-normal hover:bg-slate-800 transition-all shadow-sm shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Exportar PDF</span>
          </button>
        )}
      </div>

      <div className="dc-panel">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 normal-case mb-2 tracking-normal ml-1">Intervalo Financeiro</label>
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="dc-input flex-1 bg-transparent border-none focus:ring-0 outline-none" />
              <span className="text-slate-300 font-semibold text-xs normal-case">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="dc-input flex-1 bg-transparent border-none focus:ring-0 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 normal-case mb-2 tracking-normal ml-1">Modalidade</label>
            <select value={tipoFluxo} onChange={e => setTipoFluxo(e.target.value)} className="dc-input w-full bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer">
              <option value="">Fluxo Completo (Tudo)</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="SAIDA">Apenas Saídas</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="dc-button bg-rose-600 text-white normal-case tracking-normal shadow-sm shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Processar Fluxo</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="dc-kpi-grid">
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Entradas (Realizado)</p>
                <p className="dc-kpi-value">{formatCur(reportData.entradasRealizadas)}</p>
                <p className="dc-kpi-hint">+ {formatCur(reportData.aReceber)} Pendente</p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Saídas (Realizado)</p>
                <p className="dc-kpi-value">{formatCur(reportData.saidasRealizadas)}</p>
                <p className="dc-kpi-hint">+ {formatCur(reportData.aPagar)} Pendente</p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Saldo em Caixa</p>
                <p className="dc-kpi-value">{formatCur(reportData.entradasRealizadas - reportData.saidasRealizadas)}</p>
                <p className="dc-kpi-hint">Líquido Realizado</p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Projeção Final</p>
                <p className="dc-kpi-value">{formatCur(reportData.totalEntradas - reportData.totalSaidas)}</p>
                <p className="dc-kpi-hint">Saldo Projetado</p>
              </div>
            </div>

            {/* TABLE VIEW */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Data</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Descrição</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-right">Valor</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-semibold normal-case text-xs tracking-normal">
                        Nenhuma movimentação encontrada
                      </td>
                    </tr>
                  ) : (
                    reportData.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-semibold text-slate-400">{item.data}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 normal-case tracking-tight">{item.descricao}</p>
                          <p className="text-xs font-semibold text-slate-400 normal-case">{item.categoria}</p>
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold text-right ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.tipo === 'ENTRADA' ? '+' : '-'} {formatCur(item.valor)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold normal-case ${item.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold normal-case text-xs tracking-normal animate-pulse">Auditando finanças...</p>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização — Mov. Financeira"
        >
          <FinanceiroTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioFinanceiroPage;