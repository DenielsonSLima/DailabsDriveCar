
import React from 'react';
import { IUsuario } from '../usuarios.types';

interface ListUsuariosProps {
  usuarios: IUsuario[];
  onEdit: (usuario: IUsuario) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const ListUsuarios: React.FC<ListUsuariosProps> = ({ usuarios, onEdit, onDelete, onToggleStatus }) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'GESTOR': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'VENDEDOR': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-slate-900 font-bold text-lg">Nenhum acesso configurado</h3>
        <p className="text-slate-400 text-sm">Crie usuários no Dashboard do Supabase para vê-los aqui.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Acesso</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {usuarios.map((u) => (
            <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${!u.ativo ? 'opacity-60' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ${u.role === 'ADMIN' ? 'bg-indigo-900' : 'bg-indigo-500'
                    }`}>
                    {u.nome?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{u.nome} {u.sobrenome || ''}</p>
                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">ID: {u.id.split('-')[0]}...</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-slate-600 font-medium">{u.email}</span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${getRoleBadge(u.role)}`}>
                  {u.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onToggleStatus(u.id)}
                  disabled={u.email === 'denielsonlima201099@gmail.com'}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full transition-all ${u.email === 'denielsonlima201099@gmail.com'
                      ? 'text-emerald-500 bg-emerald-50 opacity-60 cursor-not-allowed'
                      : u.ativo
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                    }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${u.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className="text-[10px] font-bold uppercase">{u.ativo ? 'Ativo' : 'Inativo'}</span>
                </button>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <button onClick={() => onEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    onClick={() => onDelete(u.id)}
                    disabled={u.email === 'denielsonlima201099@gmail.com'}
                    className={`p-2 rounded-lg transition-all ${u.email === 'denielsonlima201099@gmail.com'
                        ? 'text-slate-200 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    title="Excluir"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListUsuarios;
