
import { supabase } from '../../../lib/supabase';
import { IUsuario } from './usuarios.types';

export const UsuariosService = {
  /**
   * Busca perfis na tabela public.profiles.
   * Tratamento aprimorado para erros de recursão de RLS.
   */
  async getAll(): Promise<IUsuario[]> {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, cpf, telefone, role, avatar_url, email, ativo')
        .order('nome', { ascending: true });

      if (error) {
        // Se houver erro 500, provavelmente é a recursão de política no banco
        if (status === 500 || error.message.includes('recursion')) {
          throw new Error("Falha Crítica de RLS: Recursão infinita detectada nas políticas do banco de dados.");
        }
        console.error(`Erro Supabase [${status}]:`, error.message);
        return [];
      }

      return (data || []).map(u => ({
        ...u,
        created_at: new Date().toISOString()
      })) as IUsuario[];
    } catch (err: any) {
      console.error('Erro ao listar usuários:', err.message);
      throw err; // Repassa para a Page tratar a UI
    }
  },

  /**
   * Salva ou atualiza um usuário.
   */
  async save(usuario: Partial<IUsuario>): Promise<void> {
    const isNew = !usuario.id;

    if (isNew) {
      if (!usuario.email || !usuario.senha || usuario.senha.length < 6) {
        throw new Error("E-mail e senha (mín. 6 caracteres) são obrigatórios.");
      }

      // 1. Criar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: usuario.email,
        password: usuario.senha,
        options: {
          data: {
            nome: usuario.nome,
            sobrenome: usuario.sobrenome,
            telefone: usuario.telefone,
            cpf: usuario.cpf,
            role: usuario.role,
            ativo: usuario.ativo !== undefined ? usuario.ativo : true
          }
        }
      });

      if (authError) {
        if (authError.message.includes('Database error')) {
          throw new Error("Erro de banco de dados no Supabase Auth. Verifique se o usuário já existe.");
        }
        throw authError;
      }

      if (!authData.user) throw new Error("Erro ao gerar credenciais de acesso.");

      // O perfil na tabela 'public.profiles' é criado automaticamente pelo TRIGGER 'on_auth_user_created'
    } else {
      // Atualização de usuário existente
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: usuario.nome,
          sobrenome: usuario.sobrenome,
          cpf: usuario.cpf,
          telefone: usuario.telefone,
          role: usuario.role,
          ativo: usuario.ativo !== undefined ? usuario.ativo : true
        })
        .eq('id', usuario.id);

      if (error) throw error;
    }
  },

  async toggleStatus(id: string, currentStatus: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ ativo: !currentStatus })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    // Verifica lançamentos em vendas
    const { count: countVendas, error: errVendas } = await supabase
      .from('venda_pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    // Verifica lançamentos em compras
    const { count: countCompras, error: errCompras } = await supabase
      .from('cmp_pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if ((countVendas && countVendas > 0) || (countCompras && countCompras > 0)) {
      throw new Error("Este usuário possui lançamentos (vendas/compras) vinculados no sistema e não pode ser excluído. Em vez disso, apenas inative o acesso.");
    }

    // Chama a função segura no banco de dados para excluir da auth.users
    const { error } = await supabase.rpc('delete_user_completely', { user_id: id });

    if (error) {
      if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
        throw new Error("Este usuário possui registros vinculados no banco de dados e não pode ser excluído.");
      }
      throw error;
    }
  },

  subscribeToChanges(callback: () => void) {
    return supabase
      .channel('public:profiles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        callback
      )
      .subscribe();
  },

  unsubscribeFromChanges(channel: any) {
    supabase.removeChannel(channel);
  }
};
