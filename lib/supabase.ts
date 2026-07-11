
/**
 * UNICO CLIENTE SUPABASE DO SISTEMA
 * Configurado com persistência robusta e auto-refresh de tokens.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'nexus_erp_auth_token', // Nome fixo para evitar conflitos
    storage: window.localStorage
  },
  global: {
    headers: { 'x-application-name': 'nexus-erp' }
  }
});
