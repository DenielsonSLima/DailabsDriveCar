import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import VendasTemplate from '../templates/vendas/VendasTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios.service';
import { getVendaReportItem } from '../../pedidos-venda/utils/venda-values';
import { formatDateOnly } from '../../../utils/date';

const RelatorioVendasPage: React.FC = () => {
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
  const [vendedorId, setVendedorId] = useState('');
  const [vendedores, setVendedores] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        EmpresaService.getDadosEmpresa().then(setEmpresa),
        MarcaDaguaService.getConfig().then(setWatermark),
        RelatoriosService.getVendedoresAtivos().then(data => setVendedores(data || []))
      ]);
      // Auto-load once vendors/config are ready
      fetchData();
    };
    init();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const vendas = await RelatoriosService.getVendasParaRelatorio({
        dataInicio,
        dataFim,
        vendedorId
      });

      const items = (vendas || []).map((v: any) => ({ ...getVendaReportItem(v), data: formatDateOnly(v.data_venda) }));
      const totalUnidades = items.reduce((sum, item) => sum + item.quantidade, 0);

      const totalVendas = items.reduce((a: number, i: any) => a + i.venda, 0);
      const lucroBruto = items.reduce((a: number, i: any) => a + i.lucro, 0);
      const ticketMedio = totalUnidades > 0 ? totalVendas / totalUnidades : 0;
      const margemMedia = totalVendas > 0 ? ((lucroBruto / totalVendas) * 100) : 0;

      setReportData({
        periodo: `${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        totalVendas,
        totalUnidades,
        ticketMedio,
        lucroBruto,
        margemMedia: Number(margemMedia.toFixed(1)),
        items
      });
    } catch (err) {
      console.error('Erro ao gerar relatório de vendas:', err);
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
            <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal">Relatórios / Comercial</p>
            <h1 className="dc-page-title">Vendas Detalhadas</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="dc-button flex items-center space-x-2 bg-slate-900 text-white normal-case tracking-normal hover:bg-slate-800 transition-all shadow-sm shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Imprimir PDF</span>
          </button>
        )}
      </div>

      <div className="dc-panel">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 normal-case mb-2 tracking-normal ml-1">Período de Análise</label>
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="dc-input flex-1 bg-transparent border-none text-slate-900 focus:ring-0 outline-none" />
              <span className="text-slate-300 font-semibold text-xs normal-case px-2">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="dc-input flex-1 bg-transparent border-none text-slate-900 focus:ring-0 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 normal-case mb-2 tracking-normal ml-1">Vendedor</label>
            <select value={vendedorId} onChange={e => setVendedorId(e.target.value)} className="dc-input w-full bg-slate-50 border border-slate-100 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer">
              <option value="">Todos os Vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="dc-button bg-indigo-600 text-white normal-case tracking-normal shadow-sm shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Atualizar Dados</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="dc-kpi-grid">
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Total Vendido</p>
                <p className="dc-kpi-value">{formatCur(reportData.totalVendas)}</p><p className="dc-kpi-hint">{reportData.totalUnidades} unidades</p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Ticket por unidade</p>
                <p className="dc-kpi-value">{formatCur(reportData.ticketMedio)}</p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Lucro Bruto</p>
                <p className="dc-kpi-value">{formatCur(reportData.lucroBruto)}</p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Margem bruta</p>
                <p className="dc-kpi-value">{reportData.margemMedia}%</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">Custos de lotes em andamento podem receber despesas posteriores.</p>
            {/* TABLE VIEW */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Data</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Veículo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Cliente</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-right">Venda</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <p className="text-slate-300 font-semibold normal-case text-xs tracking-normal">Nenhuma venda encontrada no período</p>
                      </td>
                    </tr>
                  ) : (
                    reportData.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-xs font-semibold text-slate-400">{item.data}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 normal-case tracking-tight">{item.veiculo}<p className="font-normal text-xs text-slate-500 normal-case break-all">{item.identificacoes}</p></td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500 normal-case">{item.cliente}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-slate-900">{formatCur(item.venda)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-emerald-600">{formatCur(item.lucro)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold normal-case text-xs tracking-normal animate-pulse">Carregando indicadores...</p>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização do Relatório"
        >
          <VendasTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioVendasPage;