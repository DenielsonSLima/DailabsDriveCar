
import React from 'react';
import { IMarcaDaguaConfig } from '../marca-dagua.types';

interface PreviewProps {
  config: IMarcaDaguaConfig;
}

const WatermarkPreview: React.FC<PreviewProps> = ({ config }) => {
  return (
    <div className="bg-slate-100 rounded-2xl p-6 flex items-center justify-center overflow-hidden min-h-[500px] h-full border border-slate-200">
      <div className="relative bg-white w-[350px] aspect-[1/1.414] shadow-2xl rounded-sm flex flex-col p-8 select-none pointer-events-none">
        {/* Simulação de cabeçalho de documento */}
        <div className="h-4 w-2/3 bg-slate-100 rounded-full mb-3"></div>
        <div className="h-3 w-1/2 bg-slate-50 rounded-full mb-10"></div>
        
        <div className="space-y-4">
          <div className="h-2 w-full bg-slate-50 rounded-full"></div>
          <div className="h-2 w-full bg-slate-50 rounded-full"></div>
          <div className="h-2 w-4/5 bg-slate-50 rounded-full"></div>
          <div className="h-2 w-full bg-slate-50 rounded-full"></div>
          <div className="h-2 w-3/4 bg-slate-50 rounded-full"></div>
        </div>

        <div className="mt-20 space-y-4">
          <div className="h-10 w-full border border-slate-100 rounded"></div>
          <div className="h-10 w-full border border-slate-100 rounded"></div>
        </div>

        {/* A Marca D'água Real */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {config.logo_url ? (
            <img 
              src={config.logo_url} 
              alt="Preview" 
              style={{ 
                opacity: config.opacidade / 100,
                transform: `scale(${config.tamanho / 100})`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="text-slate-200 font-black text-2xl uppercase tracking-[0.2em] -rotate-45">
              Sem Logomarca
            </div>
          )}
        </div>

        <div className="mt-auto pt-8 border-t border-slate-50 flex justify-between">
          <div className="h-2 w-16 bg-slate-50 rounded-full"></div>
          <div className="h-2 w-8 bg-slate-50 rounded-full"></div>
        </div>
        
        {/* Badge Informativa */}
        <div className="absolute top-4 right-4 px-2 py-1 bg-indigo-50 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded border border-indigo-100">
          Preview A4
        </div>
      </div>
    </div>
  );
};

export default WatermarkPreview;
