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
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Relatórios / Gestão</p>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Movimentação Financeira</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Exportar PDF</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Intervalo Financeiro</label>
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 outline-none" />
              <span className="text-slate-300 font-black text-[9px] uppercase">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Modalidade</label>
            <select value={tipoFluxo} onChange={e => setTipoFluxo(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer">
              <option value="">Fluxo Completo (Tudo)</option>
              <option value="ENTRADA">Apenas Entradas</option>
              <option value="SAIDA">Apenas Saídas</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Processar Fluxo</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Entradas (Realizado)</p>
                <p className="text-xl font-black text-emerald-700">{formatCur(reportData.entradasRealizadas)}</p>
                <p className="text-[8px] font-bold text-emerald-500 mt-1 uppercase tracking-tight">+ {formatCur(reportData.aReceber)} Pendente</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Saídas (Realizado)</p>
                <p className="text-xl font-black text-rose-700">{formatCur(reportData.saidasRealizadas)}</p>
                <p className="text-[8px] font-bold text-rose-500 mt-1 uppercase tracking-tight">+ {formatCur(reportData.aPagar)} Pendente</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo em Caixa</p>
                <p className="text-xl font-black text-slate-900">{formatCur(reportData.entradasRealizadas - reportData.saidasRealizadas)}</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Líquido Realizado</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl text-white">
                <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Projeção Final</p>
                <p className="text-xl font-black">{formatCur(reportData.totalEntradas - reportData.totalSaidas)}</p>
                <p className="text-[8px] font-bold text-rose-400 mt-1 uppercase">Saldo Projetado</p>
              </div>
            </div>

            {/* TABLE VIEW */}
            <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">
                        Nenhuma movimentação encontrada
                      </td>
                    </tr>
                  ) : (
                    reportData.items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{item.data}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.descricao}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{item.categoria}</p>
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.tipo === 'ENTRADA' ? '+' : '-'} {formatCur(item.valor)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${item.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
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
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Auditando finanças...</p>
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