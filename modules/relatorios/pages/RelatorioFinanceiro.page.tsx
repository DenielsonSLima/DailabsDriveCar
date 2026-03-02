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
    EmpresaService.getDadosEmpresa().then(setEmpresa);
    MarcaDaguaService.getConfig().then(setWatermark);
  }, []);

  const handleGerar = async () => {
    setLoading(true);
    try {
      const filtros: any = {};
      if (dataInicio) filtros.dataInicio = dataInicio;
      if (dataFim) filtros.dataFim = dataFim;
      if (tipoFluxo) filtros.tipo = tipoFluxo;

      const [totals, historico] = await Promise.all([
        FinanceiroService.getHistoricoTotals(filtros),
        FinanceiroService.getHistoricoGeral({ ...filtros, limit: 200 })
      ]);

      const items = historico.data.map((h: any) => ({
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
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Erro ao gerar relatório financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
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
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Movimentação Financeira</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Intervalo de Datas</label>
            <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-slate-200">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none" />
              <span className="text-slate-300 font-black text-[9px] uppercase">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Tipo de Fluxo</label>
            <select value={tipoFluxo} onChange={e => setTipoFluxo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer">
              <option value="">Todos</option>
              <option value="ENTRADA">Apenas Receitas</option>
              <option value="SAIDA">Apenas Despesas</option>
            </select>
          </div>
          <button
            onClick={handleGerar}
            disabled={loading}
            className="px-6 py-3.5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>Gerar Relatório</span>
              </>
            )}
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-100 rounded-[2rem] py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2z" /></svg>
          </div>
          <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Selecione o período e clique em gerar relatório</p>
        </div>
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