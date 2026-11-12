import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import EstoqueTemplate from '../templates/estoque/EstoqueTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios.service';

const RelatorioEstoquePage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [statusFiltro, setStatusFiltro] = useState('DISPONIVEL');

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
      const veiculos = await RelatoriosService.getEstoqueParaRelatorio(statusFiltro);

      const items = (veiculos || []).map((v: any) => ({
        placa: v.placa || '—',
        modelo: v.montadora?.nome || 'N/I',
        versao: `${v.modelo?.nome || ''} ${v.versao?.nome || ''}`.trim() || '—',
        ano: `${v.ano_fabricacao || '—'}/${v.ano_modelo || '—'}`,
        cor: v.cor || '—',
        custo: (v.valor_custo || 0) + (v.valor_custo_servicos || 0),
        venda: v.valor_venda || 0
      }));

      const totalUnidades = items.length;
      const valorTotalCusto = items.reduce((a: number, i: any) => a + i.custo, 0);
      const valorTotalVenda = items.reduce((a: number, i: any) => a + i.venda, 0);

      setReportData({
        totalUnidades,
        valorTotalCusto,
        valorTotalVenda,
        items
      });
    } catch (err) {
      console.error('Erro ao gerar relatório de estoque:', err);
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
            <p className="text-xs font-semibold text-blue-500 normal-case tracking-normal">Relatórios / Operacional</p>
            <h1 className="dc-page-title">Posição de Estoque</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="dc-button flex items-center space-x-2 bg-slate-900 text-white normal-case tracking-normal hover:bg-slate-800 transition-all shadow-sm shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Imprimir Inventário</span>
          </button>
        )}
      </div>

      <div className="dc-panel">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 normal-case mb-2 tracking-normal ml-1">Filtro de Status</label>
            <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)} className="dc-input w-full bg-slate-50 border border-slate-100 text-[#111827] focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
              <option value="DISPONIVEL">Apenas Veículos em Estoque (Disponíveis)</option>
              <option value="VENDIDO">Apenas Veículos Vendidos</option>
              <option value="TODOS">Histórico Completo (Todos)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 normal-case mb-2 tracking-normal ml-1">Categoria/Marca</label>
            <select className="dc-input w-full bg-slate-50 border border-slate-100 text-[#111827] focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
              <option value="">Todas as Categorias</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="dc-button bg-blue-600 text-white normal-case tracking-normal shadow-sm shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Atualizar Lista</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="dc-kpi-grid">
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Unidades em Estoque</p>
                <p className="dc-kpi-value">{reportData.totalUnidades} <span className="text-xs text-slate-400 font-semibold ml-1 normal-case">Veículos</span></p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Valor Total de Custo</p>
                <p className="dc-kpi-value">{formatCur(reportData.valorTotalCusto)}</p>
              </div>
              <div className="dc-kpi-card">
                <p className="dc-kpi-label">Valor de Venda (Estimado)</p>
                <p className="dc-kpi-value">{formatCur(reportData.valorTotalVenda)}</p>
              </div>
            </div>

            {/* TABLE VIEW */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Placa</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Modelo / Versão</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Ano/Cor</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-right">Custo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-right">Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-semibold normal-case text-xs tracking-normal">
                        Nenhum veículo encontrado para os filtros selecionados
                      </td>
                    </tr>
                  ) : (
                    reportData.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-xs font-semibold normal-case tracking-normal">{item.placa}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 normal-case tracking-tight leading-none mb-1">{item.modelo}</p>
                          <p className="text-xs font-semibold text-slate-400 normal-case truncate max-w-[200px]">{item.versao}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-600">{item.ano}</p>
                          <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal">{item.cor}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-slate-400 italic">{formatCur(item.custo)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-right text-blue-600">{formatCur(item.venda)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold normal-case text-xs tracking-normal animate-pulse">Carregando estoque...</p>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização do Inventário"
        >
          <EstoqueTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioEstoquePage;