import { supabase } from '../lib/supabase';

export class RagService {
  /**
   * Chamada segura para a Inteligência Artificial via Edge Function
   */
  async chatResponse(query: string, organizationId?: string): Promise<string> {
    try {
        console.log('Nexus AI: Solicitando resposta segura...');
        
        const { data, error } = await supabase.functions.invoke('nexus-chat', {
            body: { 
                query, 
                organizationId: organizationId || null 
            }
        });

        if (error) {
            console.error('Erro na Edge Function:', error);
            throw error;
        }

        if (data?.error) {
            if (data.error.includes('GEMINI_API_KEY')) {
                return "Configuração pendente: O Nexus AI precisa da sua GEMINI_API_KEY nos Secrets do Supabase para ser ativado.";
            }
            return `Atenção: ${data.error}`;
        }

        return data?.text || "Desculpe, não recebi uma resposta válida.";
    } catch (error: any) {
        console.error('Erro Nexus AI:', error);
        
        // Se houver falha na chamada da função
        const errorMsg = error?.message || "";
        if (errorMsg.includes('GEMINI_API_KEY') || errorMsg.includes('not found')) {
            return "O Nexus AI ainda não foi ativado. Por favor, configure a GEMINI_API_KEY nos Secrets do Supabase.";
        }

        return "Tive um problema técnico ao conectar com o Nexus AI. Verifique se as Edge Functions estão ativas no seu projeto.";
    }
  }
}

export const ragService = new RagService();
