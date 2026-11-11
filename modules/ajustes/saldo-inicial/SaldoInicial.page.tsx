
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContasBancariasService } from '../contas-bancarias/contas.service';
import { IContaBancaria } from '../contas-bancarias/contas.types';

const SaldoInicialPage: React.FC = () => {
  const navigate = useNavigate();
  const [contas, setContas] = useState<IContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedConta, setSelectedConta] = useState<IContaBancaria | null>(null);
  const [formData, setFormData] = useState({ data: '', valor: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
    
    // Escuta mudanças na tabela de contas para atualizar a lista automaticamente
    const sub = ContasBancariasService.subscribe(() => {
      loadData(true);
    });

    return () => { sub.unsubscribe(); };
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ContasBancariasService.getAll();
      setContas(data);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleOpenModal = (conta: IContaBancaria) => {
    setSelectedConta(conta);
    // Formata a data para input date (YYYY-MM-DD)
    const dateStr = conta.data_saldo_inicial ? new Date(conta.data_saldo_inicial).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Prepara o valor inicial já formatado
    setFormData({
      data: dateStr,
      valor: formatCurrency(conta.saldo_inicial)
    });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove tudo que não for dígito
    value = value.replace(/\D/g, "");
    
    // Converte para número (centavos)
    const numericValue = Number(value) / 100;
    
    // Formata novamente para string BRL
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numericValue);

    setFormData(prev => ({ ...prev, valor: formatted }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConta) return;

    setIsSaving(true);
    try {
      // Converte data simples para ISO timestamp
      const isoDate = new Date(formData.data + 'T12:00:00Z').toISOString();
      
      // Converte a string formatada "R$ 1.234,56" para float 1234.56
      const rawValue = formData.valor.replace(/\D/g, '');
      const floatValue = Number(rawValue) / 100;

      await ContasBancariasService.setSaldoInicial(selectedConta.id, floatValue, isoDate);
      
      showToast('success', 'Saldo inicial definido com sucesso!');
      setSelectedConta(null);
    } catch (e) {
      showToast('error', 'Erro ao atualizar saldo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--/--/----';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto relative">
      
      {/* Toast Notification Component */}
      {toast && (
        <div data-drivecar-ui className={`fixed top-6 right-6 z-[250] px-6 py-4 rounded-2xl shadow-sm flex items-center space-x-3 animate-in slide-in-from-right duration-200 border backdrop-blur-md ${
          toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 
          'bg-rose-600 text-white border-rose-400/50'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 
            'bg-white text-rose-600'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.type === 'success' ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <button onClick={() => navigate('/ajustes')} className="mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Saldo Inicial</h1>
            <p className="text-slate-500 mt-1">Defina o ponto de partida financeiro para cada conta.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : contas.length === 0 ? (
          <div className="text-center py-20 text-slate-400">Nenhuma conta encontrada. Cadastre uma conta primeiro.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {contas.map(conta => (
              <div 
                key={conta.id} 
                onClick={() => handleOpenModal(conta)}
                className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: conta.cor_cartao }}>
                    <span className="font-medium text-xs">{conta.banco_nome.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{conta.banco_nome}</h4>
                    <p className="text-xs text-slate-500 font-mono">AG: {conta.agencia || '-'} • CC: {conta.conta || '-'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs normal-case font-medium text-slate-500 tracking-normal mb-1">Saldo de Abertura</p>
                  <div className="flex items-center justify-end space-x-3">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {formatDate(conta.data_saldo_inicial)}
                    </span>
                    <span className={`text-xl font-semibold ${conta.saldo_inicial > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {formatCurrency(conta.saldo_inicial)}
                    </span>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Específico */}
      {selectedConta && (
        <div data-drivecar-ui className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-900 normal-case tracking-tight">Definir Saldo Inicial</h2>
              <p className="text-slate-500 text-xs mt-1 font-medium">{selectedConta.banco_nome} • {selectedConta.conta}</p>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Data de Referência (Corte)</label>
                <input 
                  type="date" 
                  required
                  value={formData.data}
                  onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-2 ml-1 leading-tight">O sistema considerará este valor como o saldo disponível no início do dia selecionado.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 normal-case mb-2 tracking-normal ml-1">Valor do Saldo</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  required
                  value={formData.valor}
                  onChange={handleCurrencyChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-mono font-medium text-2xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setSelectedConta(null)} 
                  disabled={isSaving}
                  className="px-6 py-3 text-slate-500 font-semibold normal-case text-xs tracking-normal hover:bg-slate-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold normal-case text-xs tracking-normal shadow-sm shadow-none disabled:opacity-50 min-w-[140px] flex items-center justify-center"
                >
                  {isSaving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaldoInicialPage;
