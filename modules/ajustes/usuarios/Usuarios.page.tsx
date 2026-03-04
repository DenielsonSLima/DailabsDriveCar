
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsuariosService } from './usuarios.service';
import { IUsuario } from './usuarios.types';
import ListUsuarios from './components/ListUsuarios';
import FormUsuario from './components/FormUsuario';

const UsuariosPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUsuario | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successCreds, setSuccessCreds] = useState<{ email: string, tempPassword: string } | null>(null);
  // Modal de sucesso de exclusão
  const [successDelete, setSuccessDelete] = useState<string | null>(null);
  // Modal de confirmação de exclusão
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // guard p/ armazenar o nome do usuário a excluir
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>('');
  // Modal de erro in-app
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    loadUsuarios();

    const channel = UsuariosService.subscribeToChanges(() => {
      loadUsuarios();
    });

    return () => {
      UsuariosService.unsubscribeFromChanges(channel);
    };
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await UsuariosService.getAll();
      setUsuarios(data);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Falha ao conectar com o banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: IUsuario) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: Partial<IUsuario>) => {
    try {
      const result = await UsuariosService.save(data) as { tempPassword?: string } | void;
      await loadUsuarios();
      setIsFormOpen(false);
      setEditingUser(null);

      if (result && result.tempPassword && data.email) {
        setSuccessCreds({ email: data.email, tempPassword: result.tempPassword });
      }
    } catch (err: any) {
      setErrorModal(err.message);
    }
  };

  const handleDelete = (id: string) => {
    const userToDel = usuarios.find(u => u.id === id);
    if (userToDel?.email === 'denielsonlima201099@gmail.com') {
      setErrorModal('Ação bloqueada: Este usuário é do TI (Sistema) e não pode ser excluído.');
      return;
    }
    setConfirmDeleteName(`${userToDel?.nome ?? ''} ${userToDel?.sobrenome ?? ''}`.trim());
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const deletedName = confirmDeleteName;
    setConfirmDeleteId(null);
    try {
      await UsuariosService.delete(confirmDeleteId);
      await loadUsuarios();
      setSuccessDelete(deletedName);
    } catch (err: any) {
      setErrorModal(err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const userToToggle = usuarios.find(u => u.id === id);
    if (userToToggle?.email === 'denielsonlima201099@gmail.com' && currentStatus === true) {
      setErrorModal('Ação bloqueada: O usuário de TI não pode ser inativado.');
      return;
    }

    try {
      await UsuariosService.toggleStatus(id, currentStatus);
      await loadUsuarios();
    } catch (err: any) {
      setErrorModal(`Erro ao alterar status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
            <h1 className="text-3xl font-bold text-slate-900">Usuários e Acessos</h1>
            <p className="text-slate-500 mt-1">Gerencie os perfis vinculados às contas de acesso.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isFormOpen && (
            <button
              onClick={handleOpenAdd}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Novo Perfil
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl">
        {isFormOpen ? (
          <FormUsuario
            initialData={editingUser}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        ) : (
          <div className="space-y-6">
            {errorStatus && (
              <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-start space-x-4 animate-in zoom-in-95">
                <div className="bg-rose-100 p-3 rounded-2xl text-rose-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">Erro de Configuração no Banco</h3>
                  <p className="text-rose-700 text-sm mt-1 leading-relaxed">{errorStatus}</p>
                  <p className="text-rose-500 text-[10px] mt-4 uppercase font-bold">Dica: Verifique se as políticas de RLS não são recursivas no seu SQL Editor.</p>
                </div>
              </div>
            )}

            {!errorStatus && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start space-x-3">
                <div className="text-indigo-500 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  <span className="font-bold">Gerenciamento de Perfis:</span> Esta lista exibe os dados da tabela <code className="bg-indigo-100 px-1 rounded font-bold italic">profiles</code>.
                </p>
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aguardando Supabase...</p>
              </div>
            ) : !errorStatus && (
              <ListUsuarios
                usuarios={usuarios}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={(id) => {
                  const user = usuarios.find(u => u.id === id);
                  if (user) {
                    handleToggleStatus(id, user.ativo ?? true);
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-rose-500 p-6 flex items-center justify-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <div className="p-8 text-center space-y-3">
              <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Remover Acesso</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Deseja realmente remover o acesso de <strong>{confirmDeleteName || 'este usuário'}</strong>? Esta ação é <strong>irreversível</strong>.
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95"
                >
                  Sim, Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso de Exclusão */}
      {successDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-700 p-6 flex items-center justify-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="p-8 text-center space-y-3">
              <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Acesso Removido</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                O acesso de <strong>{successDelete}</strong> foi removido com sucesso do sistema.
              </p>
              <button
                onClick={() => setSuccessDelete(null)}
                className="w-full py-3 mt-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal de Erro In-App */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 p-6 flex items-center justify-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="p-8 text-center space-y-3">
              <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Atenção</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{errorModal}</p>
              <button
                onClick={() => setErrorModal(null)}
                className="w-full py-3 mt-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Credenciais de Acesso Criadas */}
      {successCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-500 p-6 flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Acesso Criado!</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                O usuário foi criado com sucesso. Copie a senha provisória abaixo e envie ao novo colaborador. <b>Ele terá que trocá-la no primeiro acesso.</b>
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 mt-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail (Login)</label>
                  <div className="font-mono text-sm text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-100 select-all">
                    {successCreds.email}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Senha Gerada</label>
                  <div className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 select-all tracking-wider text-center">
                    {successCreds.tempPassword}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSuccessCreds(null)}
                className="w-full py-4 mt-6 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
