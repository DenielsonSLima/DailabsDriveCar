import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import EstoqueTemplate from '../templates/estoque/EstoqueTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios.service';

const RelatorioEstoquePage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [statusFiltro, setStatusFiltro] = useState('DISPONIVEL');

  useEffect(() => {
    EmpresaService.getDadosEmpresa().then(setEmpresa);
    MarcaDaguaService.getConfig().then(setWatermark);
  }, []);

  const handleGerar = async () => {
    setLoading(true);
    try {
      const veiculos = await RelatoriosService.getEstoqueParaRelatorio(statusFiltro);

      const items = (veiculos || []).map((v: any) => ({
        placa: v.placa || '—',
        modelo: v.montadora?.nome || 'N/I',
        versao: `${v.modelo?.nome || ''} ${v.versao?.nome || ''}`.trim() || '—',
        ano: `${v.ano_fabricacao || '—'}/${v.ano_modelo || '—'}`,
        cor: v.cor || '—',
        custo: (v.valor_custo || 0) + (v.valor_custo_servicos || 0),
        venda: v.valor_venda || 0
      }));

      const totalUnidades = items.length;
      const valorTotalCusto = items.reduce((a: number, i: any) => a + i.custo, 0);
      const valorTotalVenda = items.reduce((a: number, i: any) => a + i.venda, 0);

      setReportData({
        totalUnidades,
        valorTotalCusto,
        valorTotalVenda,
        items
      });
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Erro ao gerar relatório de estoque:', err);
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
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Relatórios / Operacional</p>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Posição de Estoque</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Status</label>
            <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
              <option value="DISPONIVEL">Apenas Disponíveis</option>
              <option value="TODOS">Todos os Veículos</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Categoria</label>
            <select className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer">
              <option value="">Todas</option>
            </select>
          </div>
          <button
            onClick={handleGerar}
            disabled={loading}
            className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span>Gerar Inventário</span>
              </>
            )}
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-100 rounded-[2rem] py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Selecione os parâmetros do estoque para visualização</p>
        </div>
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização do Inventário"
        >
          <EstoqueTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioEstoquePage;