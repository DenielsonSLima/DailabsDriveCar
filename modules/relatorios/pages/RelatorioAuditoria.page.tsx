import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import AuditoriaTemplate from '../templates/auditoria/AuditoriaTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { LogsService } from '../../ajustes/logs/logs.service';

const RelatorioAuditoriaPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [busca, setBusca] = useState('');
  const [nivel, setNivel] = useState('');

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
      const logs = await LogsService.fetchLogs();

      let filtered = logs || [];
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        filtered = filtered.filter((l: any) =>
          (l.acao || l.action || '').toLowerCase().includes(termo) ||
          (l.usuario || l.user_email || '').toLowerCase().includes(termo) ||
          (l.descricao || l.description || l.details || '').toLowerCase().includes(termo) ||
          (l.referencia || l.entity || '').toLowerCase().includes(termo)
        );
      }
      if (nivel) {
        filtered = filtered.filter((l: any) => (l.nivel || l.level || l.tipo || 'INFO').toUpperCase() === nivel);
      }

      const items = filtered.slice(0, 100).map((l: any) => {
        const dt = new Date(l.created_at || l.timestamp);
        return {
          acao: l.acao || l.action || l.tipo || 'Ação do Sistema',
          data: dt.toLocaleDateString('pt-BR'),
          hora: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          usuario: l.usuario || l.user_email || l.user_id?.substring(0, 8) || 'Sistema',
          referencia: l.referencia || l.entity || l.tabela || l.entity_id?.substring(0, 8) || '—',
          detalhes: l.descricao || l.description || l.details || l.old_value || null,
          nivel: (l.nivel || l.level || l.tipo || 'INFO').toUpperCase()
        };
      });

      setReportData({
        totalEventos: filtered.length,
        criticos: filtered.filter((l: any) => (l.nivel || l.level || '').toUpperCase() === 'CRITICAL' || (l.nivel || l.level || '').toUpperCase() === 'ERROR').length,
        informativos: filtered.filter((l: any) => (l.nivel || l.level || '').toUpperCase() !== 'CRITICAL' && (l.nivel || l.level || '').toUpperCase() !== 'ERROR').length,
        items
      });
    } catch (err) {
      console.error('Erro ao gerar relatório de auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relatórios / Segurança</p>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Logs de Auditoria</h1>
          </div>
        </div>

        {reportData && (
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Expressar PDF</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Filtro de busca</label>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Usuário, ação ou registro..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Criticidade</label>
            <select value={nivel} onChange={e => setNivel(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none appearance-none cursor-pointer">
              <option value="">Todas as Ocorrências</option>
              <option value="CRITICAL">Críticos / Erros</option>
              <option value="INFO">Informativos</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Rastrear Eventos</span>}
          </button>
        </div>

        {reportData ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Logs</p>
                <p className="text-3xl font-black text-slate-900">{reportData.totalEventos}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Últimos 100 registros mantidos em cache</p>
              </div>
              <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">Eventos Críticos</p>
                <p className="text-3xl font-black text-rose-700">{reportData.criticos}</p>
                <p className="text-[9px] font-bold text-rose-400 mt-2 uppercase tracking-widest">Requerem atenção imediata</p>
              </div>
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl text-white">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-bold">Operações Normais</p>
                <p className="text-3xl font-black">{reportData.informativos}</p>
                <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Fluxo padrão do sistema</p>
              </div>
            </div>

            {/* LOG VIEW */}
            <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Evento / Usuário</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Referência</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nível</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium">
                  {reportData.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Nenhum log encontrado para os critérios</td>
                    </tr>
                  ) : (
                    reportData.items.map((l: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-6 font-bold text-slate-400 tabular-nums">
                          {l.data}<br/>
                          <span className="text-[10px] text-slate-300">{l.hora}</span>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{l.acao}</p>
                          <p className="text-[10px] font-bold text-slate-500 lowercase">{l.usuario}</p>
                        </td>
                        <td className="px-6 py-6 text-slate-500 font-black uppercase tracking-widest text-[9px]">{l.referencia}</td>
                        <td className="px-6 py-6">
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] ${l.nivel === 'CRITICAL' || l.nivel === 'ERROR' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                            {l.nivel}
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
            <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Auditando trilha de segurança...</p>
          </div>
        )}
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização — Auditoria"
        >
          <AuditoriaTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioAuditoriaPage;