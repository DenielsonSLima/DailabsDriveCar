import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

// GEMINI CONFIGURATION
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'PLACE_YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

export interface RagMetadata {
  source_table?: string;
  source_id?: string;
  type?: 'vehicle' | 'partner' | 'transaction' | 'system_doc';
  [key: string]: any;
}

export interface RagResult {
  id: string;
  content: string;
  metadata: RagMetadata;
  similarity: number;
}

class RagService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = genAI;
  }

  /**
   * Gera o embedding vetorial para um texto
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (GEMINI_API_KEY.includes('PLACE_YOUR_API_KEY')) {
        console.warn('RAG Service: GEMINI_API_KEY não configurada. Usando vetor fake.');
        return new Array(768).fill(0);
      }
      
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      throw error;
    }
  }

  /**
   * Insere ou atualiza uma memória no banco vetorial
   */
  async upsertMemory(content: string, metadata: RagMetadata, organization_id: string) {
    try {
      const embedding = await this.generateEmbedding(content);
      
      const { error } = await supabase
        .from('rag_memory')
        .upsert({
            content,
            metadata,
            embedding,
            organization_id
        }, { 
            onConflict: 'metadata->>source_id, organization_id' 
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar memória RAG:', error);
      throw error;
    }
  }

  /**
   * Realiza busca semântica na memória da organização
   */
  async searchMemory(query: string, organization_id: string, limit = 5, threshold = 0.3): Promise<RagResult[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const { data, error } = await supabase.rpc('match_rag_memory', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        p_organization_id: organization_id
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro na busca semântica RAG:', error);
      throw error;
    }
  }

  /**
   * Gera uma resposta baseada no contexto recuperado
   */
  async chatResponse(query: string, organizationId: string): Promise<string> {
    try {
        // 1. Busca contexto relevante
        const contextResults = await this.searchMemory(query, organizationId, 8);
        
        if (contextResults.length === 0) {
            return "Não encontrei informações específicas sobre isso no seu ERP. Posso tentar ajudar com informações gerais do sistema.";
        }

        // 2. Formata o contexto
        const contextText = contextResults
            .map((res, i) => `[RECURSO ${i + 1}]: ${res.content}`)
            .join('\n\n');

        // 3. Prompt Persona
        const prompt = `
            Você é o Nexus AI, o assistente inteligente e instrutor oficial do ecossistema NEXUS ERP (especializado em revenda de veículos/Hidrocar).

            SUA MISSÃO:
            1. Analisar os dados do ERP (Estoque, Financeiro, Parceiros) para fornecer insights.
            2. Agir como um TUTOR ESPECIALIZADO, ensinando o usuário a realizar tarefas no sistema.

            CONHECIMENTO BASE DO SISTEMA (REGRAS DE OURO):
            - CADASTRO DE VEÍCULO: É OBRIGATÓRIO criar um "Pedido de Compra" primeiro. Depois, cadastra-se o veículo dentro do pedido. O veículo só entra no estoque oficialmente após a "Confirmação do Pedido de Compra".
            - REMOÇÃO/SAÍDA: Para liberar um veículo para venda ou saída, o pedido de compra deve estar devidamente confirmado e o financeiro alinhado.
            - SÓCIOS: Devem ser cadastrados no módulo "Parceiros" com o tipo "Sócio" para participarem dos rateios.
            - CONTAS: Gerenciadas em "Ajustes > Contas Bancárias". Inclui bancos e caixa físico.
            - PEDIDOS DE VENDA: Geram automaticamente os títulos no Contas a Receber e baixam o veículo do estoque.

            DADOS EM TEMPO REAL RECUPERADOS DO ERP:
            ${contextText}

            PERGUNTA DO USUÁRIO:
            ${query}

            DIRETRIZES DE RESPOSTA:
            - Se a pergunta for sobre "Como fazer algo": Use o CONHECIMENTO BASE e explique o passo a passo de forma didática.
            - Se a pergunta for sobre dados: Seja extremamente preciso. Use apenas os dados fornecidos.
            - Responda em Português do Brasil de forma executiva, amigável e instrutiva.
            - Use Markdown (negrito para nomes, tabelas para listas, listas para passos).
        `;

        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Erro Gemini Response:', error);
        return "Tive um problema técnico ao consultar minha base de conhecimento. Tente novamente.";
    }
  }
}

export const ragService = new RagService();
