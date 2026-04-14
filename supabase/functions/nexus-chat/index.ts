import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { query, organizationId } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY não encontrada.' }), { status: 200, headers: CORS_HEADERS })
    }

    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

    // 1. Embedding
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })
    const embResult = await embeddingModel.embedContent(query)
    const embedding = embResult.embedding.values

    // 2. Search RAG
    const { data: contextResults, error: rpcError } = await supabaseClient.rpc('match_rag_memory', {
      query_embedding: embedding,
      match_threshold: 0.2,
      match_count: 8,
      p_organization_id: organizationId || null
    })

    if (rpcError) throw rpcError

    const contextText = contextResults?.length > 0 
      ? contextResults.map((res: any, i: number) => `[DADO ${i + 1}]: ${res.content}`).join('\\n\\n')
      : ""

    // 3. AI Completion - ULTRA CONCISE MODE
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })
    const prompt = `
        Você é o Nexus AI do Dailabs DriveCar. 
        Sua principal diretriz é ser EXTREMAMENTE DIRETO e CONCISO.
        
        REGRAS CRÍTICAS:
        - PROIBIDO saudações (Olá, Oi, etc).
        - PROIBIDO apresentações (Eu sou o Nexus...).
        - PROIBIDO perguntas de cortesia ou enrolação.
        - Se a pergunta permitir mais de um caminho, mostre todos IMEDIATAMENTE.
        - Use apenas negrito para nomes de menus e tópicos numerados.
        
        GUIA DE ROTAS RÁPIDAS:
        - Pedido de Venda: Menu > Pedidos Venda > Novo Pedido.
        - Pedido de Compra: Menu > Pedidos Compra > Novo Pedido.
        - Sócios: Menu > Ajustes > Sócios.
        - Parceiros (Clientes/Fornecedores): Menu > Parceiros.
        - Estoque/Veículos: Menu > Estoque.
        
        CONTEXTO DO SISTEMA:
        ${contextText}

        PERGUNTA DO USUÁRIO:
        ${query}
        
        RESPONDA DIRETAMENTE AO PONTO:
    `;

    const chatResult = await model.generateContent(prompt)
    const responseText = chatResult.response.text()

    return new Response(
      JSON.stringify({ text: responseText.trim() }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
