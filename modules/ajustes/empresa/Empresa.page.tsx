
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmpresaService } from './empresa.service';
import { IEmpresa } from './empresa.types';
import FormEmpresa from './components/FormEmpresa';

const EmpresaPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empresa, setEmpresa] = useState<IEmpresa | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
    // Ativa o listener de realtime
    const subscription = EmpresaService.subscribe(() => {
      loadData(true); // Recarrega silenciosamente (sem spinner full screen)
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await EmpresaService.getDadosEmpresa();
      setEmpresa(data);
    } catch (error) {
      console.error(error);
      showToast('error', 'Falha ao carregar dados.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmit = async (data: IEmpresa) => {
    setSaving(true);
    try {
      const saved = await EmpresaService.saveDadosEmpresa(data);
      // setEmpresa(saved); // O Realtime já vai atualizar, mas podemos atualizar otimisticamente
      showToast('success', 'Dados da empresa atualizados com sucesso!');
    } catch (error: any) {
      showToast('error', 'Erro ao salvar: ' + (error.message || 'Desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleConsultCnpj = async (cnpj: string) => {
    const data = await EmpresaService.consultarCNPJ(cnpj);
    if (!data) {
      showToast('error', 'CNPJ não encontrado na base pública.');
    } else {
      showToast('success', 'Dados importados da Receita!');
    }
    return data;
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200 relative">
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
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Dados da Empresa</h1>
            <p className="text-slate-500 mt-1">Configure as informações fiscais e identidade visual.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-2xl border border-slate-200">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium normal-case text-xs tracking-normal">Carregando configurações...</p>
          </div>
        ) : (
          <FormEmpresa 
            initialData={empresa} 
            onSubmit={handleSubmit} 
            onConsultCnpj={handleConsultCnpj}
            isSaving={saving}
          />
        )}
      </div>
    </div>
  );
};

export default EmpresaPage;
