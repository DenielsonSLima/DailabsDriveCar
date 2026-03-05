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
        loadContas();
        EmpresaService.getDadosEmpresa().then(setEmpresa);
        MarcaDaguaService.getConfig().then(setWatermark);

        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        setFiltros(prev => ({
            ...prev,
            dataInicio: inicioMes.toISOString().split('T')[0],
            dataFim: hoje.toISOString().split('T')[0]
        }));
    }, []);

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

    const handleGerarRelatorio = async () => {
        if (!filtros.contaId || !filtros.dataInicio || !filtros.dataFim) {
            alert('Selecione a conta e o período.');
            return;
        }

        setLoading(true);
        try {
            const res = await FinanceiroService.getExtratoPorConta(filtros.contaId, filtros.dataInicio, filtros.dataFim);

            let txs = res.transacoes;
            if (filtros.tipo) {
                txs = txs.filter(t => t.tipo === filtros.tipo);
            }

            let runningBalance = res.saldoAnterior;
            const linhasProgressivas = txs.map(t => {
                const valor = Number(t.valor || 0);
                if (t.tipo === 'ENTRADA') runningBalance += valor;
                if (t.tipo === 'SAIDA') runningBalance -= valor;
                return {
                    ...t,
                    saldoMomentaneo: runningBalance
                };
            });

            setSaldoAnterior(res.saldoAnterior);
            setSaldoFinal(res.saldoFINAL);
            setTransacoes(linhasProgressivas);

            setReportData({
                transacoes: linhasProgressivas,
                saldoAnterior: res.saldoAnterior,
                saldoFinal: res.saldoFINAL,
                contaNome: contas.find(c => c.id === filtros.contaId)?.banco_nome,
                periodo: `${new Date(filtros.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(filtros.dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`,
                tipoFiltro: filtros.tipo
            });

            setIsPreviewOpen(true);
        } catch (e) {
            console.error('Erro ao gerar relatório', e);
            alert('Erro ao carregar dados do extrato.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">

            {/* Header */}
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
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Extrato Bancário</h1>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm min-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 items-end text-sm">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Conta Bancária</label>
                        <select
                            value={filtros.contaId}
                            onChange={e => setFiltros(prev => ({ ...prev, contaId: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                            disabled={loadingContas}
                        >
                            {contas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.banco_nome} - {c.titular} | Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saldo_atual || 0)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Período</label>
                        <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-slate-200">
                            <input
                                type="date"
                                value={filtros.dataInicio}
                                onChange={e => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                                className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none"
                            />
                            <span className="text-slate-300 font-black text-[9px] uppercase">até</span>
                            <input
                                type="date"
                                value={filtros.dataFim}
                                onChange={e => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                                className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Tipo</label>
                        <select
                            value={filtros.tipo}
                            onChange={e => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">TODOS</option>
                            <option value="ENTRADA">RECEITAS</option>
                            <option value="SAIDA">DESPESAS</option>
                            <option value="TRANSFERENCIA">TRANSFERÊNCIAS</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-center mt-12">
                    <button
                        onClick={handleGerarRelatorio}
                        disabled={loading || !filtros.contaId}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span>Gerar Extrato</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-20 border-2 border-dashed border-slate-100 rounded-[2rem] py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2z" /></svg>
                    </div>
                    <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Selecione os parâmetros e gere o extrato bancário</p>
                </div>
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
