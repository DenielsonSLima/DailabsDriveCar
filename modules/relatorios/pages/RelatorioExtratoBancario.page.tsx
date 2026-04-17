import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceiroService } from '../../financeiro/financeiro.service';
import { ITransacao } from '../../financeiro/financeiro.types';
import { IContaBancaria } from '../../ajustes/contas-bancarias/contas.types';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import ExtratoTemplate from '../templates/extrato/ExtratoTemplate';

const RelatorioExtratoBancarioPage: React.FC = () => {
    const navigate = useNavigate();
    const [contas, setContas] = useState<IContaBancaria[]>([]);
    const [loadingContas, setLoadingContas] = useState(true);
    const [empresa, setEmpresa] = useState<any>(null);
    const [watermark, setWatermark] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [filtros, setFiltros] = useState({
        contaId: '',
        dataInicio: '',
        dataFim: '',
        tipo: '' // ENTRADA, SAIDA, TRANSFERENCIA, ou vazio
    });

    const [loading, setLoading] = useState(false);
    const [saldoAnterior, setSaldoAnterior] = useState(0);
    const [saldoFinal, setSaldoFinal] = useState(0);
    const [transacoes, setTransacoes] = useState<ITransacao[]>([]);
    const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        EmpresaService.getDadosEmpresa().then(setEmpresa),
        MarcaDaguaService.getConfig().then(setWatermark),
        loadContas()
      ]);
    };
    init();
  }, []);

  useEffect(() => {
    if (filtros.contaId && !reportData && !loading) {
      fetchData();
    }
  }, [filtros.contaId]);

  const loadContas = async () => {
    try {
      const data = await FinanceiroService.getContasBancarias();
      setContas(data);
      if (data.length > 0) {
        setFiltros(prev => ({ ...prev, contaId: data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar contas bancárias', error);
    } finally {
      setLoadingContas(false);
    }
  };

  const fetchData = async () => {
    if (!filtros.contaId || !filtros.dataInicio || !filtros.dataFim) return;

    setLoading(true);
    try {
      const res = await FinanceiroService.getExtratoPorConta(filtros.contaId, filtros.dataInicio, filtros.dataFim);

      let txs = res.transacoes;
      if (filtros.tipo) {
        txs = txs.filter((t: any) => t.tipo === filtros.tipo);
      }

      let runningBalance = res.saldoAnterior;
      const linhasProgressivas = txs.map((t: any) => {
        const valor = Number(t.valor || 0);
        if (t.tipo === 'ENTRADA') runningBalance += valor;
        if (t.tipo === 'SAIDA') runningBalance -= valor;
        return {
          ...t,
          saldoMomentaneo: runningBalance
        };
      });

      const totalReceitas = txs.filter((t: any) => t.tipo === 'ENTRADA').reduce((a: number, b: any) => a + Number(b.valor), 0);
      const totalDespesas = txs.filter((t: any) => t.tipo === 'SAIDA').reduce((a: number, b: any) => a + Number(b.valor), 0);

      setReportData({
        transacoes: linhasProgressivas,
        saldoAnterior: res.saldoAnterior,
        saldoFinal: res.saldoFINAL,
        totalReceitas,
        totalDespesas,
        contaNome: contas.find(c => c.id === filtros.contaId)?.banco_nome,
        periodo: `${new Date(filtros.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(filtros.dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        tipoFiltro: filtros.tipo
      });
    } catch (e) {
      console.error('Erro ao gerar relatório', e);
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
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Relatórios / Financeiro</p>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Extrato Bancário</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Gerar Documento PDF</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Conta para Conciliação</label>
            <select
              value={filtros.contaId}
              onChange={e => setFiltros(prev => ({ ...prev, contaId: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
              disabled={loadingContas}
            >
              {contas.map(c => (
                <option key={c.id} value={c.id}>{c.banco_nome} - {c.titular}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Periodo Analítico</label>
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <input type="date" value={filtros.dataInicio} onChange={e => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))} className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 outline-none" />
              <span className="text-slate-300 font-black text-[9px] uppercase">atp</span>
              <input type="date" value={filtros.dataFim} onChange={e => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))} className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold focus:ring-0 outline-none" />
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading || !filtros.contaId}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Conciliar Extrato</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Anterior</p>
                <p className="text-xl font-black text-slate-900">{formatCur(reportData.saldoAnterior)}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Entradas</p>
                <p className="text-xl font-black text-emerald-700">+{formatCur(reportData.totalReceitas)}</p>
              </div>
              <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Saídas</p>
                <p className="text-xl font-black text-rose-700">-{formatCur(reportData.totalDespesas)}</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl text-white">
                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1 font-bold">Saldo do Período</p>
                <p className="text-xl font-black">{formatCur(reportData.saldoFinal)}</p>
              </div>
            </div>

            {/* TABLE VIEW */}
            <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Histórico</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-medium">
                  {reportData.transacoes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs">Sem lançamentos para este filtro</td>
                    </tr>
                  ) : (
                    reportData.transacoes.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.descricao}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{t.tipo}</p>
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right ${t.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.tipo === 'ENTRADA' ? '+' : '-'} {formatCur(t.valor)}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-right text-slate-900">
                          {formatCur(t.saldoMomentaneo)}
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
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Cruzando extratos bancários...</p>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização do Extrato"
        >
          <ExtratoTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioExtratoBancarioPage;
