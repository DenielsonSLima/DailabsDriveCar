import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RelatoriosQuickPreview from '../components/RelatoriosQuickPreview';
import ServicosTemplate from '../templates/servicos/ServicosTemplate';
import { EmpresaService } from '../../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../../ajustes/marca-dagua/marca-dagua.service';
import { RelatoriosService } from '../relatorios.service';

const RelatorioServicosPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [statusFiltro, setStatusFiltro] = useState('TODOS');

  useEffect(() => {
    EmpresaService.getDadosEmpresa().then(setEmpresa);
    MarcaDaguaService.getConfig().then(setWatermark);
  }, []);

  const handleGerar = async () => {
    setLoading(true);
    try {
      // Buscar veículos com despesas
      const veiculos = await RelatoriosService.getServicosParaRelatorio();

      // Filtrar veículos que possuem despesas
      let veiculosComDespesas = (veiculos || []).filter((v: any) =>
        v.despesas && v.despesas.length > 0
      );

      // Aplicar filtro de status do veículo
      if (statusFiltro === 'DISPONIVEL') {
        veiculosComDespesas = veiculosComDespesas.filter((v: any) => v.status === 'DISPONIVEL');
      } else if (statusFiltro === 'VENDIDO') {
        veiculosComDespesas = veiculosComDespesas.filter((v: any) => v.status === 'VENDIDO');
      }

      let totalDespesas = 0;
      let custoTotalServicos = 0;
      let despesasPagas = 0;
      let despesasPendentes = 0;
      let totalPago = 0;
      let totalPendente = 0;

      const veiculosFormatados = veiculosComDespesas.map((v: any) => {
        const despesasFormatadas = (v.despesas || []).map((d: any) => {
          totalDespesas++;
          const valor = d.valor_total || 0;
          if (d.status_pagamento === 'PAGO') {
            despesasPagas++;
            totalPago += valor;
          } else {
            despesasPendentes++;
            totalPendente += valor;
          }
          return {
            data: d.data ? new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—',
            descricao: d.descricao || 'Sem descrição',
            categoria: d.categoria?.nome || '—',
            status: d.status_pagamento || 'PENDENTE',
            valor
          };
        });

        const custoServicos = v.valor_custo_servicos || despesasFormatadas.reduce((a: number, d: any) => a + d.valor, 0);
        custoTotalServicos += custoServicos;

        return {
          modelo: `${v.montadora?.nome || ''} ${v.modelo?.nome || ''} ${v.versao?.nome || ''}`.trim() || 'Veículo',
          placa: v.placa || '—',
          status: v.status,
          custoServicos,
          despesas: despesasFormatadas
        };
      });

      setReportData({
        totalVeiculos: veiculosComDespesas.length,
        totalDespesas,
        custoTotalServicos,
        custoMedio: veiculosComDespesas.length > 0 ? custoTotalServicos / veiculosComDespesas.length : 0,
        despesasPagas,
        despesasPendentes,
        totalPago,
        totalPendente,
        veiculos: veiculosFormatados
      });
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Erro ao gerar relatório de serviços:', err);
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
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Relatórios / Operacional</p>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Gastos com Serviços</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm min-h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Status do Veículo</label>
            <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none appearance-none cursor-pointer">
              <option value="TODOS">Todos os Veículos</option>
              <option value="DISPONIVEL">Apenas Disponíveis</option>
              <option value="VENDIDO">Apenas Vendidos</option>
            </select>
          </div>
          <div></div>
          <button
            onClick={handleGerar}
            disabled={loading}
            className="px-6 py-3.5 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span>Gerar Relatório</span>
              </>
            )}
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-100 rounded-[2rem] py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
          </div>
          <p className="text-slate-300 font-black uppercase text-xs tracking-[0.2em]">Selecione os filtros e gere o relatório de serviços</p>
        </div>
      </div>

      {/* QUICK PREVIEW MODAL */}
      {reportData && (
        <RelatoriosQuickPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Pré-visualização — Gastos com Serviços"
        >
          <ServicosTemplate
            empresa={empresa}
            watermark={watermark}
            data={reportData}
          />
        </RelatoriosQuickPreview>
      )}
    </div>
  );
};

export default RelatorioServicosPage;
