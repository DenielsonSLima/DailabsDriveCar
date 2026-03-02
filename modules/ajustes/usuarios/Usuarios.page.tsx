
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

  useEffect(() => {
    loadUsuarios();

    // Inicia subscrição Realtime no Supabase para a tabela profiles
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
      await UsuariosService.save(data);
      // loadUsuarios is now triggered by realtime
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente remover este acesso?')) {
      try {
        await UsuariosService.delete(id);
        // loadUsuarios is now triggered by realtime
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await UsuariosService.toggleStatus(id, currentStatus);
    } catch (err: any) {
      alert(`Erro ao alterar status: ${err.message}`);
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
                    // Impede o usuário de desativar a si mesmo se necessário (opcional)
                    handleToggleStatus(id, user.ativo ?? true);
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosPage;
