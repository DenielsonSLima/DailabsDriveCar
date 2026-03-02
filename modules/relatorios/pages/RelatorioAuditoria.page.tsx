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
    EmpresaService.getDadosEmpresa().then(setEmpresa);
    MarcaDaguaService.getConfig().then(setWatermark);
  }, []);

  const handleGerar = async () => {
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
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Erro ao gerar relatório de auditoria:', err);
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Relatórios / Segurança</p>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Logs de Auditoria</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Busca Textual</label>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Usuário, ação ou registro..." className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nível</label>
            <select value={nivel} onChange={e => setNivel(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none appearance-none cursor-pointer">
              <option value="">Todos</option>
              <option value="CRITICAL">Críticos</option>
              <option value="ERROR">Erros</option>
              <option value="INFO">Informativos</option>
            </select>
          </div>
          <button
            onClick={handleGerar}
            disabled={loading}
            className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>Gerar Relatório</span>
              </>
            )}
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-100 rounded-[2rem] py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Clique em gerar relatório para rastrear eventos do sistema</p>
        </div>
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