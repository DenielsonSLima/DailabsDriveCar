import React, { useState, useEffect } from 'react';
import { FinanceiroService } from '../../financeiro/financeiro.service';
import { ITransacao } from '../../financeiro/financeiro.types';
import { IContaBancaria } from '../../ajustes/contas-bancarias/contas.types';

const RelatorioExtratoBancarioPage: React.FC = () => {
    const [contas, setContas] = useState<IContaBancaria[]>([]);
    const [loadingContas, setLoadingContas] = useState(true);

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
    const [gerou, setGerou] = useState(false);

    useEffect(() => {
        loadContas();
        // Default dates: start of current month to today
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

            setSaldoAnterior(res.saldoAnterior);
            setSaldoFinal(res.saldoFINAL);
            setTransacoes(txs);
            setGerou(true);
        } catch (e) {
            console.error('Erro ao gerar relatório', e);
            alert('Erro ao carregar dados do extrato.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: string) => {
        const d = new Date(date + 'T12:00:00'); // simple fix for timezone offset displaying previous day
        return d.toLocaleDateString('pt-BR');
    };

    const printReport = () => {
        window.print();
    };

    // Linhas calculadas com saldo progressivo
    // Se houver filtros de tipo aplicado, o saldo momentâneo ficará estranho (não baterá a matemática visual).
    // Por isso é melhor não calcular saldo progressivo se houver filtro de tipo, ou avisar o usuário.
    let runningBalance = saldoAnterior;
    const linhasProgressivas = transacoes.map(t => {
        const valor = Number(t.valor || 0);
        if (t.tipo === 'ENTRADA') runningBalance += valor;
        if (t.tipo === 'SAIDA') runningBalance -= valor;

        // Transferência tem SAIDA na origem
        // Como a conta bancária é sempre a conta_origem na listagem de extrato (graças a forma como implementamos no banco)
        // Transferência_Saida = Debito
        // Mas e se a conta_origem na transferencia for entrada? 
        // Na verdade em fin_transacoes "TRANSFERENCIA" de entrada entra como ENTRADA.
        return {
            ...t,
            saldoMomentaneo: runningBalance
        };
    });

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Extrato Bancário</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Conferência de Caixa</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => window.history.back()} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
                        Voltar
                    </button>
                    {gerou && (
                        <button onClick={printReport} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">
                            Imprimir Extrato
                        </button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm print:hidden">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Parâmetros do Extrato</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Conta Bancária</label>
                        <select
                            value={filtros.contaId}
                            onChange={e => setFiltros(prev => ({ ...prev, contaId: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            disabled={loadingContas}
                        >
                            {contas.map(c => (
                                <option key={c.id} value={c.id}>{c.banco_nome}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data Inicial</label>
                        <input
                            type="date"
                            value={filtros.dataInicio}
                            onChange={e => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data Final</label>
                        <input
                            type="date"
                            value={filtros.dataFim}
                            onChange={e => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo</label>
                        <select
                            value={filtros.tipo}
                            onChange={e => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="">TODOS</option>
                            <option value="ENTRADA">RECEITAS</option>
                            <option value="SAIDA">DESPESAS</option>
                            <option value="TRANSFERENCIA">TRANSFERÊNCIAS</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleGerarRelatorio}
                        disabled={loading || !filtros.contaId}
                        className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                    >
                        {loading ? 'Gerando...' : 'Gerar Extrato'}
                    </button>
                </div>
            </div>

            {/* Relatório Gerado */}
            {gerou && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:break-inside-auto">

                    {/* Print Header */}
                    <div className="p-8 border-b border-slate-100 bg-slate-50 print:bg-white text-center">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Extrato de Movimentação</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Conta: {contas.find(c => c.id === filtros.contaId)?.banco_nome || 'N/A'}</p>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
                            Período: {formatDate(filtros.dataInicio)} a {formatDate(filtros.dataFim)}
                        </p>
                    </div>

                    {/* Tabela de Extrato */}
                    <div className="overflow-x-auto text-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 print:bg-white text-slate-400 text-[10px] uppercase tracking-widest font-black">
                                    <th className="py-4 px-6 border-b border-slate-100">Data</th>
                                    <th className="py-4 px-6 border-b border-slate-100">Descrição</th>
                                    <th className="py-4 px-6 border-b border-slate-100">Forma</th>
                                    <th className="py-4 px-6 border-b border-slate-100 text-right">Crédito (+)</th>
                                    <th className="py-4 px-6 border-b border-slate-100 text-right">Débito (-)</th>
                                    <th className="py-4 px-6 border-b border-slate-100 text-right">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium text-slate-600">
                                {/* Linha Saldo Anterior */}
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <td className="py-3 px-6 font-bold" colSpan={5}>SALDO ANTERIOR</td>
                                    <td className={`py-3 px-6 text-right font-black ${saldoAnterior >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(saldoAnterior)}</td>
                                </tr>

                                {/* Movimentações */}
                                {linhasProgressivas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 text-sm font-bold">Nenhuma movimentação neste período.</td>
                                    </tr>
                                ) : (
                                    linhasProgressivas.map((linha, idx) => {
                                        const isCredito = linha.tipo === 'ENTRADA';
                                        const valorNum = Number(linha.valor);
                                        return (
                                            <tr key={linha.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="py-3 px-6 text-slate-500">{formatDate(linha.data_pagamento)}</td>
                                                <td className="py-3 px-6">
                                                    <span className="font-bold text-slate-800">{linha.descricao || '-'}</span>
                                                    {linha.titulo?.parceiro?.nome && (
                                                        <span className="block text-[10px] text-slate-400 truncate max-w-[200px]">{linha.titulo.parceiro.nome}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-6 text-slate-500">{linha.forma_pagamento?.nome || '-'}</td>
                                                <td className="py-3 px-6 text-right text-emerald-600 font-black">{isCredito ? formatCurrency(valorNum) : ''}</td>
                                                <td className="py-3 px-6 text-right text-rose-600 font-black">{!isCredito ? formatCurrency(valorNum) : ''}</td>
                                                <td className={`py-3 px-6 text-right font-black ${linha.saldoMomentaneo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {filtros.tipo ? '-' : formatCurrency(linha.saldoMomentaneo)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}

                                {/* Linha Saldo Final */}
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <td className="py-4 px-6 font-black text-slate-800 text-sm" colSpan={5}>SALDO FINAL</td>
                                    <td className={`py-4 px-6 text-right font-black text-sm ${saldoFinal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {filtros.tipo ? '-' : formatCurrency(saldoFinal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {filtros.tipo && (
                        <div className="p-4 bg-amber-50 text-amber-600 text-[10px] font-bold text-center border-t border-amber-100 uppercase tracking-widest">
                            A exibição do saldo progressivo foi ocultada pois há filtros ativos.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RelatorioExtratoBancarioPage;
