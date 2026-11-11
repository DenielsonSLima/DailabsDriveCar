import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import PatrimonioConciliacaoTemplate from '../templates/caixa/PatrimonioConciliacaoTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios.service';

const RelatorioPatrimonioConciliacaoPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [dataInicio, setDataInicio] = useState(firstDay.toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(lastDay.toISOString().split('T')[0]);

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
      const data = await RelatoriosService.getConciliacaoPatrimonial({
        dataInicio,
        dataFim
      });

      if (!data) throw new Error('Dados não retornados');

      setReportData({
        ...data,
        periodo: `${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`
      });
    } catch (err: any) {
      console.error('Erro:', err);
      toast.error('Não foi possível carregar a conciliação patrimonial.');
    } finally {
      setLoading(false);
    }
  };

  const formatCur = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
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
            <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal">Relatórios / Controladoria</p>
            <h1 className="text-3xl font-semibold text-slate-900 normal-case tracking-tight leading-none">Conciliação Patrimonial</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-semibold normal-case text-xs tracking-normal hover:bg-slate-800 transition-all shadow-sm shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Gerar Extrato Patrimonial</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 normal-case mb-2 tracking-normal ml-1">Período de Conciliação</label>
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 outline-none" />
              <span className="text-slate-300 font-semibold text-xs normal-case px-2">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 outline-none" />
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-semibold normal-case text-xs tracking-normal shadow-sm shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Conciliar Dados</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-2">Patrimônio Inicial</p>
                <p className="text-3xl font-semibold text-slate-900">{formatCur(reportData.patrimonio_inicial)}</p>
                <p className="text-xs font-bold text-slate-400 mt-2 normal-case">Posição em {new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-emerald-600 normal-case tracking-normal">Entradas</span>
                    <span className="text-xs font-semibold text-emerald-600">{formatCur(reportData.total_entradas)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-600 normal-case tracking-normal">Saídas</span>
                    <span className="text-xs font-semibold text-rose-600">({formatCur(reportData.total_saidas)})</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Resultado Líquido</p>
                  <p className={`text-xl font-semibold ${(reportData.total_entradas - reportData.total_saidas) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCur(reportData.total_entradas - reportData.total_saidas)}
                  </p>
                </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-sm text-white">
                <p className="text-xs font-semibold text-indigo-300 normal-case tracking-normal mb-2 font-bold">Patrimônio Final</p>
                <p className="text-3xl font-semibold">{formatCur(reportData.patrimonio_final)}</p>
                <p className="text-xs font-bold text-indigo-400 mt-2 normal-case">Posição em {new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* TRANSACTIONS VIEW */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[11px] font-semibold text-slate-900 normal-case tracking-normal">Movimentações do Período</h3>
                <span className="text-xs font-bold text-slate-400 normal-case">{reportData.transacoes?.length || 0} registros</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Data</th>
                    <th className="px-8 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Descrição</th>
                    <th className="px-8 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal">Tipo</th>
                    <th className="px-8 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-right">Valor</th>
                    <th className="px-8 py-4 text-xs font-semibold text-slate-400 normal-case tracking-normal text-right">Saldo Patr. Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-medium">
                  {(!reportData.transacoes || reportData.transacoes.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-300 font-bold normal-case text-xs">Sem lançamentos no intervalo analítico</td>
                    </tr>
                  ) : (
                    reportData.transacoes.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-4 text-xs text-slate-400 font-bold">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                        <td className="px-8 py-4 text-xs font-semibold text-slate-800 normal-case tracking-tight">{t.descricao}</td>
                        <td className="px-8 py-4 text-xs text-slate-500 font-bold normal-case tracking-tight">{t.tipo_descricao || t.categoria?.nome || 'GERAL'}</td>
                        <td className={`px-8 py-4 text-xs font-semibold text-right ${t.tipo_movimento === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.tipo_movimento === 'ENTRADA' ? '+' : '-'} {formatCur(t.valor)}
                        </td>
                        <td className="px-8 py-4 text-xs font-semibold text-right text-slate-900">
                          {formatCur(t.patrimonio_liquido)}
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
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold normal-case text-xs tracking-normal animate-pulse">Cruzando dados patrimoniais...</p>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Extrato de Conciliação Patrimonial"
        >
          <PatrimonioConciliacaoTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioPatrimonioConciliacaoPage;
