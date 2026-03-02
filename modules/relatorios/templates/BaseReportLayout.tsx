import React from 'react';

interface Props {
  empresa: any;
  watermark: any;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const BaseReportLayout: React.FC<Props> = ({ empresa, watermark, title, subtitle, children }) => {
  return (
    <div className="relative p-12 bg-white text-slate-900 min-h-[297mm] flex flex-col font-sans border-[12px] border-slate-50">

      {/* Selo de Certificação flutuante no topo */}
      <div className="absolute top-10 right-10 z-20">
        <div className="w-24 h-24 border-2 border-slate-100 rounded-full flex flex-col items-center justify-center text-center p-2 opacity-30 grayscale">
          <svg className="w-8 h-8 text-slate-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <span className="text-[6px] font-black uppercase tracking-widest leading-none">Dados Auditados</span>
        </div>
      </div>

      {/* Marca d'água Profissional */}
      {watermark?.logo_url && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img
            src={watermark.logo_url}
            style={{
              opacity: watermark.opacidade / 200,
              transform: `scale(${watermark.tamanho / 100})`,
              maxWidth: '60%',
              maxHeight: '60%'
            }}
            alt=""
          />
        </div>
      )}

      {/* Cabeçalho Premium */}
      <header className="relative z-10 border-b-4 border-slate-900 pb-10 mb-12 flex justify-between items-end">
        <div className="flex items-center gap-8">
          {empresa?.logo_url && <img src={empresa.logo_url} className="h-20 w-auto object-contain" alt="Logo" />}
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{empresa?.nome_fantasia || 'NEXUS ERP'}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{empresa?.razao_social}</p>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold mt-2">
              <span>CNPJ: {empresa?.cnpj}</span>
              <span>{empresa?.cidade} / {empresa?.uf}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-300 mb-2">{title}</h2>
          {subtitle && <p className="text-sm font-black text-slate-900 uppercase">{subtitle}</p>}
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </header>

      {/* Conteúdo do Relatório */}
      <main className="relative z-10 flex-1">
        {children}
      </main>

      {/* Rodapé do Documento */}
      <footer className="relative z-10 mt-10 pt-6 border-t border-slate-100 flex justify-between items-end">
        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          Nexus Operating Core • Protocolo Digital Auditável
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SISTEMA DE GESTÃO INTEGRADA</p>
        </div>
      </footer>
    </div>
  );
};

export default BaseReportLayout;