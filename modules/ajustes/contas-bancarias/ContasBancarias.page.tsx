
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContasBancariasService } from './contas.service';
import { IContaBancaria } from './contas.types';
import ContaForm from './components/ContaForm';
import ConfirmModal from '../../../components/ConfirmModal';

const ContasBancariasPage: React.FC = () => {
  const navigate = useNavigate();
  const [contas, setContas] = useState<IContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<IContaBancaria | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado de notificação
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  useEffect(() => {
    loadData();
    const sub = ContasBancariasService.subscribe((eventType) => {
      loadData(true);
      if (eventType !== 'Em local') {
        showToast('info', 'Sincronizado: Lista atualizada remotamente.');
      }
    });
    return () => { sub.unsubscribe(); };
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), type === 'info' ? 2000 : 3500);
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ContasBancariasService.getAll();
      setContas(data);
    } catch (e) {
      console.error(e);
      if (!silent) showToast('error', 'Erro ao carregar contas.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleEdit = (conta: IContaBancaria) => {
    setEditingConta(conta);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (conta: IContaBancaria) => {
    try {
      await ContasBancariasService.toggleStatus(conta.id, !conta.ativo);
      showToast('success', `Conta ${!conta.ativo ? 'ativada' : 'inativada'} com sucesso.`);
      // O realtime atualiza a lista, mas atualizamos otimisticamente aqui se quiser
    } catch (error: any) {
      showToast('error', 'Erro ao alterar status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await ContasBancariasService.remove(deleteId);
      setDeleteId(null);
      showToast('success', 'Conta removida com sucesso.');
    } catch (error: any) {
      showToast('error', 'Erro ao excluir: ' + (error.message || 'Desconhecido'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (data: Partial<IContaBancaria>) => {
    try {
      await ContasBancariasService.save(data);
      setIsFormOpen(false);
      showToast('success', data.id ? 'Conta atualizada com sucesso!' : 'Nova conta criada com sucesso!');
      loadData(true);
    } catch (error: any) {
      console.error(error);
      showToast('error', 'Erro ao salvar: ' + (error.message || 'Verifique os dados'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[250] px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right duration-300 border backdrop-blur-md ${toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' :
            toast.type === 'info' ? 'bg-indigo-600/95 text-white border-indigo-400/50' :
              'bg-rose-600 text-white border-rose-400/50'
          }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 text-white' :
              toast.type === 'info' ? 'bg-white text-indigo-600' :
                'bg-white text-rose-600'
            }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.type === 'success' ? "M5 13l4 4L19 7" : toast.type === 'info' ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <button onClick={() => navigate('/ajustes')} className="mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Contas Bancárias</h1>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-md animate-pulse">Realtime</span>
            </div>
            <p className="text-slate-500 mt-1">Gerencie suas contas correntes e caixas.</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingConta(null); setIsFormOpen(true); }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 flex items-center transition-all"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Nova Conta
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : contas.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-200 border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <p className="text-slate-400 font-bold uppercase text-sm">Nenhuma conta cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contas.map(conta => (
            <div key={conta.id} className={`relative group rounded-[2rem] shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden cursor-default ${!conta.ativo ? 'grayscale opacity-75' : ''}`}>

              {/* Card Face */}
              <div
                className="p-6 h-full flex flex-col justify-between text-white min-h-[200px]"
                style={{ background: `linear-gradient(135deg, ${conta.cor_cartao} 0%, ${conta.cor_cartao}dd 100%)` }}
              >
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                {/* Header Card */}
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold leading-tight uppercase tracking-wider">{conta.banco_nome}</h3>
                    <p className="text-[10px] uppercase opacity-70 tracking-widest">Instituição {conta.ativo ? '' : '(Inativa)'}</p>
                  </div>
                  {/* Fake Chip */}
                  <div className="w-9 h-6 bg-yellow-200/80 rounded-md shadow-sm border border-yellow-300/50"></div>
                </div>

                {/* Middle - Account Info */}
                <div className="relative z-10 mt-6 font-mono tracking-wider opacity-90 text-sm">
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-[8px] uppercase block opacity-60">Agência</span>
                      {conta.agencia || '---'}
                    </div>
                    <div>
                      <span className="text-[8px] uppercase block opacity-60">Conta</span>
                      {conta.conta || '---'}
                    </div>
                  </div>
                </div>

                {/* Bottom - Holder */}
                <div className="relative z-10 mt-6">
                  <p className="text-[8px] uppercase opacity-60 tracking-widest mb-0.5">Titular</p>
                  <p className="font-bold text-sm uppercase tracking-wider truncate">{conta.titular}</p>
                </div>

                {/* Actions Overlay (Hover) */}
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3 z-20">
                  <button onClick={() => handleEdit(conta)} className="bg-white text-slate-900 px-3 py-2.5 rounded-xl text-xs font-black uppercase hover:scale-105 transition-transform flex items-center" title="Editar">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(conta)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black uppercase hover:scale-105 transition-transform flex items-center text-white ${conta.ativo ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    title={conta.ativo ? 'Inativar Conta' : 'Ativar Conta'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>

                  <button onClick={() => setDeleteId(conta.id)} className="bg-rose-500 text-white px-3 py-2.5 rounded-xl text-xs font-black uppercase hover:scale-105 transition-transform flex items-center" title="Excluir">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <ContaForm
          initialData={editingConta}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSave}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Conta?"
        message="Deseja excluir esta conta? O histórico financeiro vinculado pode ser afetado."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ContasBancariasPage;
