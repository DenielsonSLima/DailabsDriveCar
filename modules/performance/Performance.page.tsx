import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceTab, IPerformanceData } from './performance.types';
import { PerformanceService } from './performance.service';
import { EmpresaService } from '../ajustes/empresa/empresa.service';
import { MarcaDaguaService } from '../ajustes/marca-dagua/marca-dagua.service';
import MesAtual from './components/MesAtual';
import OutrosMeses from './components/OutrosMeses';
import QuickPreviewModal from '../caixa/components/QuickPreviewModal';
import PerformancePrint from './components/PerformancePrint';

import { useQuery } from '@tanstack/react-query';

/**
 * Módulo de Performance & BI
 * 2 Abas: Mês Atual | Outros Meses
 * Visão completa de toda a empresa por período.
 */
const PerformancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTab>('MES_ATUAL');
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState<IPerformanceData | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [printPeriodo, setPrintPeriodo] = useState('');

  // Queries para Metadados
  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => EmpresaService.getDadosEmpresa(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: watermark } = useQuery({
    queryKey: ['config-marca-dagua'],
    queryFn: () => MarcaDaguaService.getConfig(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const tabs: { id: PerformanceTab; label: string; icon: string }[] = [
    {
      id: 'MES_ATUAL',
      label: 'Mês Atual',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      id: 'OUTROS_MESES',
      label: 'Outros Meses',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  const handleOpenPdf = useCallback(async () => {
    setLoadingPdf(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const mesNome = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      const data = await PerformanceService.getPerformanceData(startDate, endDate);

      setPrintData(data);
      setPrintPeriodo(mesNome.charAt(0).toUpperCase() + mesNome.slice(1));
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoadingPdf(false);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Performance</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Visão completa da empresa por período</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleOpenPdf}
            disabled={loadingPdf}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingPdf ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            )}
            <span>Relatório PDF</span>
          </button>
          <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Nexus BI</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xl'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
          >
            <svg
              className={`w-4 h-4 mr-2.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="min-h-[500px]">
        {activeTab === 'MES_ATUAL' && <MesAtual />}
        {activeTab === 'OUTROS_MESES' && <OutrosMeses />}
      </div>

      {/* Quick Preview Modal (PDF) */}
      {printData && (
        <QuickPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onDownload={handlePrint}
          title="Relatório de Performance"
        >
          <PerformancePrint
            data={printData}
            empresa={empresa}
            watermark={watermark}
            periodo={printPeriodo}
          />
        </QuickPreviewModal>
      )}

      {/* Hidden print content */}
      {printData && (
        <div className="hidden print:block">
          <PerformancePrint
            data={printData}
            empresa={empresa}
            watermark={watermark}
            periodo={printPeriodo}
          />
        </div>
      )}
    </div>
  );
};

export default PerformancePage;