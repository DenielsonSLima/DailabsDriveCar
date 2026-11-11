
import React, { useRef, useState, useEffect } from 'react';
import { IMarcaDaguaConfig } from '../marca-dagua.types';

interface FormProps {
  config: IMarcaDaguaConfig;
  onSave: (config: IMarcaDaguaConfig) => void;
  onChange: (config: IMarcaDaguaConfig) => void;
  isSaving: boolean;
}

const WatermarkForm: React.FC<FormProps> = ({ config, onSave, onChange, isSaving }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localConfig, setLocalConfig] = useState<IMarcaDaguaConfig>(config);

  // Sincroniza se a config mudar externamente (ex: carregar do banco)
  useEffect(() => {
    setLocalConfig(config);
  }, [config.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logo_url = reader.result as string;
        const updated = { ...localConfig, logo_url };
        setLocalConfig(updated);
        onChange(updated); // Notifica o preview imediatamente
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...localConfig, [name]: Number(value) };
    setLocalConfig(updated);
    onChange(updated); // Notifica o preview imediatamente
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...localConfig, logo_url: '' };
    setLocalConfig(updated);
    onChange(updated);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 h-full">
      <section className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-500 normal-case mb-4 tracking-normal ml-1">Arquivo da Logomarca</label>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-48 ${
              localConfig.logo_url ? 'border-indigo-200 bg-indigo-50/5' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
            }`}
          >
            {localConfig.logo_url ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img src={localConfig.logo_url} className="max-h-full max-w-full object-contain p-2" alt="Watermark" />
                <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-all">
                  <div className="flex space-x-2">
                    <span className="bg-white px-4 py-2 rounded-xl text-xs font-medium normal-case text-indigo-600 shadow-sm">Trocar</span>
                    <button 
                      onClick={handleRemoveLogo}
                      className="bg-rose-500 px-4 py-2 rounded-xl text-xs font-semibold normal-case text-white shadow-sm hover:bg-rose-600 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm text-slate-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-slate-500 normal-case tracking-tight">Clique para Upload</p>
                <p className="text-xs text-slate-300 mt-1 normal-case font-medium tracking-normal">PNG ou JPG</p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="text-xs font-medium text-slate-500 normal-case tracking-normal">Opacidade</label>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{localConfig.opacidade}%</span>
            </div>
            <input 
              type="range" 
              name="opacidade"
              min="0" 
              max="100" 
              value={localConfig.opacidade} 
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="text-xs font-medium text-slate-500 normal-case tracking-normal">Escala da Logo</label>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{localConfig.tamanho}%</span>
            </div>
            <input 
              type="range" 
              name="tamanho"
              min="10" 
              max="100" 
              value={localConfig.tamanho} 
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </section>

      <div className="pt-6 border-t border-slate-100 flex flex-col space-y-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start space-x-3">
          <div className="mt-0.5 text-amber-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed font-medium normal-case tracking-tight">
            As alterações acima são refletidas no preview ao lado, mas só serão aplicadas aos documentos reais após salvar.
          </p>
        </div>
        
        <button
          onClick={() => onSave(localConfig)}
          disabled={isSaving}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-700 shadow-sm shadow-none transition-all disabled:opacity-50 disabled:shadow-none active:scale-100 flex items-center justify-center space-x-3"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
              <span>Processando...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Salvar Configurações</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WatermarkForm;
