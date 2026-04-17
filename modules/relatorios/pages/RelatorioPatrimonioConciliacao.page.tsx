import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Default to full current month
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [dataInicio, setDataInicio] = useState(firstDay.toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(lastDay.toISOString().split('T')[0]);

    useEffect(() => {
        EmpresaService.getDadosEmpresa().then(setEmpresa);
        MarcaDaguaService.getConfig().then(setWatermark);
    }, []);

    const handleGerar = async () => {
        setLoading(true);
        try {
            const data = await RelatoriosService.getConciliacaoPatrimonial({
                dataInicio,
                dataFim
            });

            setReportData({
                ...data,
                periodo: `${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`
            });
            setIsPreviewOpen(true);
        } catch (err) {
            console.error('Erro ao gerar relatório de conciliação:', err);
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
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Relatórios / Gestão & Auditoria</p>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Conciliação Patrimonial</h1>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm min-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Período de Conciliação</label>
                        <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-slate-200">
                            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none" />
                            <span className="text-slate-300 font-black text-[9px] uppercase">até</span>
                            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold mb-2 ml-1">Dica: Selecione um mês fechado para melhor conferência.</p>
                    </div>
                    <button
                        onClick={handleGerar}
                        disabled={loading}
                        className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <span>Gerar Conciliação</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="border-2 border-dashed border-slate-100 rounded-[2rem] py-20 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Conecte seu patrimônio e fluxo de caixa em um único relatório</p>
                    <p className="text-slate-400 text-[10px] mt-2 max-w-sm mx-auto leading-relaxed">Este relatório compara o estado inicial e final da empresa, justificando a variação através das movimentações realizadas no período.</p>
                </div>
            </div>

            {/* QUICK PREVIEW MODAL */}
            {reportData && (
                <RelatoriosQuickPreview
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    title="Conferência de Patrimônio & Fluxo"
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
