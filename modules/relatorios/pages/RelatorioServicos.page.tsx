import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import ServicosTemplate from '../templates/servicos/ServicosTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios.service';

const RelatorioServicosPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [statusFiltro, setStatusFiltro] = useState('TODOS');

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
      const veiculos = await RelatoriosService.getServicosParaRelatorio();

      let veiculosComDespesas = (veiculos || []).filter((v: any) =>
        v.despesas && v.despesas.length > 0
      );

      if (statusFiltro === 'DISPONIVEL') {
        veiculosComDespesas = veiculosComDespesas.filter((v: any) => v.status === 'DISPONIVEL');
      } else if (statusFiltro === 'VENDIDO') {
        veiculosComDespesas = veiculosComDespesas.filter((v: any) => v.status === 'VENDIDO');
      }

      let totalDespesas = 0;
      let custoTotalServicos = 0;
      let totalPago = 0;
      let totalPendente = 0;

      const veiculosFormatados = veiculosComDespesas.map((v: any) => {
        const despesasFormatadas = (v.despesas || []).map((d: any) => {
          totalDespesas++;
          const valor = d.valor_total || 0;
          if (d.status_pagamento === 'PAGO') totalPago += valor;
          else totalPendente += valor;

          return {
            data: d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
            descricao: d.descricao || 'Sem descrição',
            status: d.status_pagamento || 'PENDENTE',
            valor
          };
        });

        const custoServicos = v.valor_custo_servicos || despesasFormatadas.reduce((a: number, d: any) => a + d.valor, 0);
        custoTotalServicos += custoServicos;

        return {
          modelo: `${v.montadora?.nome || ''} ${v.modelo?.nome || ''}`.trim() || 'Veículo',
          placa: v.placa || '—',
          status: v.status,
          custoServicos,
          despesas: despesasFormatadas
        };
      });

      setReportData({
        totalVeiculos: veiculosComDespesas.length,
        totalDespesas,
        custoTotalServicos,
        totalPago,
        totalPendente,
        veiculos: veiculosFormatados
      });
    } catch (err) {
      console.error('Erro ao gerar relatório de serviços:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCur = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/relatorios')}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
          >
            <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Relatórios / Operacional</p>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Gastos com Serviços</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Imprimir PDF</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Status do Veículo</label>
            <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none appearance-none cursor-pointer">
              <option value="TODOS">Todos os Veículos com Serviços</option>
              <option value="DISPONIVEL">Apenas em Estoque (Disponíveis)</option>
              <option value="VENDIDO">Apenas Vendidos</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Verificar Gastos</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Investido</p>
                <p className="text-xl font-black text-slate-900">{formatCur(reportData.custoTotalServicos)}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Serviços Pagos</p>
                <p className="text-xl font-black text-emerald-700">{formatCur(reportData.totalPago)}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Total Pendente</p>
                <p className="text-xl font-black text-amber-700">{formatCur(reportData.totalPendente)}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl text-white">
                <p className="text-[9px] font-black text-amber-300 uppercase tracking-widest mb-1 font-bold">Ticket Médio</p>
                <p className="text-xl font-black">{formatCur(reportData.custoTotalServicos / (reportData.totalVeiculos || 1))}</p>
              </div>
            </div>

            {/* TABLE VIEW */}
            <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Veículo</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total em Serviços</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-medium">
                  {reportData.veiculos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">Nenhum serviço encontrado</td>
                    </tr>
                  ) : (
                    reportData.veiculos.map((v: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{v.modelo}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{v.placa}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${v.status === 'VENDIDO' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-right text-amber-600">
                          {formatCur(v.custoServicos)}
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
            <div className="w-16 h-16 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Auditando despesas de veículos...</p>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização — Gastos com Serviços"
        >
          <ServicosTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioServicosPage;
