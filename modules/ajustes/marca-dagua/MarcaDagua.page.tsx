
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarcaDaguaService } from './marca-dagua.service';
import { IMarcaDaguaConfig } from './marca-dagua.types';
import WatermarkForm from './components/WatermarkForm';
import WatermarkPreview from './components/WatermarkPreview';

const MarcaDaguaPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Estado padrão inicial
  const [config, setConfig] = useState<IMarcaDaguaConfig>({
    logo_url: '',
    opacidade: 30,
    tamanho: 50
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadConfig();
    // Ativa o listener de realtime
    const subscription = MarcaDaguaService.subscribe(() => {
      loadConfig(true); // Recarrega silenciosamente
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadConfig = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await MarcaDaguaService.getConfig();
      if (data) setConfig(data);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSave = async (newConfig: IMarcaDaguaConfig) => {
    setSaving(true);
    try {
      const saved = await MarcaDaguaService.saveConfig(newConfig);
      // setConfig(saved); // O Realtime atualizará, mas garantimos a UI responsiva aqui
      showToast('success', 'Configuração salva com sucesso!');
    } catch (error: any) {
      showToast('error', 'Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Atualiza o estado local para o preview reagir imediatamente (sem salvar)
  const handlePreviewUpdate = (updatedConfig: IMarcaDaguaConfig) => {
    setConfig(prev => ({ ...prev, ...updatedConfig }));
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="dc-page animate-in fade-in duration-200 relative">
      {/* Toast Notification */}
      {toast && (
        <div data-drivecar-ui className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-sm flex items-center space-x-3 animate-in slide-in-from-right duration-200 border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-rose-600'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <button 
            onClick={() => navigate('/ajustes')}
            className="mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="dc-page-title">Marca D'água</h1>
            <p className="dc-page-subtitle">Personalize a identidade visual de seus documentos e PDFs.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Configurações */}
        <div className="lg:col-span-5 h-full">
          {loading ? (
            <div className="dc-panel h-[600px] flex flex-col items-center justify-center space-y-4">
               <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-slate-500 font-medium normal-case text-xs tracking-normal">Carregando...</p>
            </div>
          ) : (
            <WatermarkForm 
              config={config} 
              onSave={handleSave} 
              onChange={handlePreviewUpdate}
              isSaving={saving} 
            />
          )}
        </div>

        {/* Lado Direito: Preview */}
        <div className="lg:col-span-7 h-full">
          <WatermarkPreview config={config} />
        </div>
      </div>
    </div>
  );
};

export default MarcaDaguaPage;
