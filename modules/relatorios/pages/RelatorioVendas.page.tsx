import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import VendasTemplate from '../templates/vendas/VendasTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios.service';

const RelatorioVendasPage: React.FC = () => {
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
  const [vendedorId, setVendedorId] = useState('');
  const [vendedores, setVendedores] = useState<any[]>([]);

  useEffect(() => {
    EmpresaService.getDadosEmpresa().then(setEmpresa);
    MarcaDaguaService.getConfig().then(setWatermark);
    RelatoriosService.getVendedoresAtivos().then(data => {
      setVendedores(data || []);
    });
  }, []);

  const handleGerar = async () => {
    setLoading(true);
    try {
      const vendas = await RelatoriosService.getVendasParaRelatorio({
        dataInicio,
        dataFim,
        vendedorId
      });

      const items = (vendas || []).map((v: any) => {
        const custoTotal = (v.veiculo?.valor_custo || 0) + (v.veiculo?.valor_custo_servicos || 0);
        const valorVenda = v.valor_venda || 0;
        const lucro = valorVenda - custoTotal;
        const veiculoNome = `${v.veiculo?.montadora?.nome || ''} ${v.veiculo?.modelo?.nome || ''} ${v.veiculo?.versao?.nome || ''}`.trim() || 'Veículo';
        return {
          data: new Date(v.data_venda).toLocaleDateString('pt-BR'),
          veiculo: veiculoNome,
          cliente: v.cliente?.nome || '—',
          custo: custoTotal,
          venda: valorVenda,
          lucro
        };
      });

      const totalVendas = items.reduce((a: number, i: any) => a + i.venda, 0);
      const lucroBruto = items.reduce((a: number, i: any) => a + i.lucro, 0);
      const ticketMedio = items.length > 0 ? totalVendas / items.length : 0;
      const margemMedia = totalVendas > 0 ? ((lucroBruto / totalVendas) * 100) : 0;

      setReportData({
        periodo: `${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        totalVendas,
        ticketMedio,
        lucroBruto,
        margemMedia: Number(margemMedia.toFixed(1)),
        items
      });
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Erro ao gerar relatório de vendas:', err);
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
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Relatórios / Comercial</p>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Vendas Detalhadas</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Período</label>
            <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-slate-200">
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none" />
              <span className="text-slate-300 font-black text-[9px] uppercase">até</span>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="flex-1 bg-white border-none px-4 py-2 text-sm font-bold text-[#111827] focus:ring-0 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Vendedor</label>
            <select value={vendedorId} onChange={e => setVendedorId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer">
              <option value="">Todos</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
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
                <span>Gerar Relatório</span>
              </>
            )}
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-100 rounded-[2rem] py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Aguardando seleção de filtros para processar dados</p>
        </div>
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização do Relatório"
        >
          <VendasTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioVendasPage;