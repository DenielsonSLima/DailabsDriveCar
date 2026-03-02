
import { supabase } from '../../lib/supabase';
import { AuthMode } from './auth.types';

export const AuthService = {
  async signIn(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) throw error;

    // Validação de acesso ativo
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('ativo')
        .eq('id', data.user.id)
        .single();

      if (profile && profile.ativo === false) {
        await supabase.auth.signOut();
        throw new Error("Seu acesso está inativo. Contate o administrador.");
      }
    }

    return data;
  },

  async signUp(email: string, senha: string, nome: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome }
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
