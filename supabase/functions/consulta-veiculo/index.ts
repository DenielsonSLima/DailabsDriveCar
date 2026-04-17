// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { placa } = await req.json()
    
    if (!placa) {
      throw new Error('Placa é obrigatória')
    }

    const limpaPlaca = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    
    // Configurações do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const API_BRASIL_TOKEN = Deno.env.get('API_BRASIL_TOKEN')

    if (!API_BRASIL_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Configuração ausente: API_BRASIL_TOKEN não definido no Supabase.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com o JWT do usuário para respeitar RLS e RPCs de uso
    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    })

    // 1. Verificar Cache Global no Banco de Dados
    const { data: cachedRow, error: cacheError } = await supabaseClient
      .from('fipe_api_cache')
      .select('dados_json, mes_referencia')
      .eq('placa', limpaPlaca)
      .maybeSingle()

    const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

    // Se existe no cache e é do mês atual, usamos o cache (Economia Total)
    if (cachedRow && cachedRow.mes_referencia.toLowerCase() === mesAtual.toLowerCase()) {
      console.log(`FIPE: [EDGE] Carregando do Cache para placa: ${limpaPlaca}`)
      
      // Registrar uso (mesmo sendo cache, registramos para o contador da loja)
      await supabaseClient.rpc('rpc_record_fipe_usage', {
        p_placa: limpaPlaca,
        p_cached: true
      })

      return new Response(
        JSON.stringify(cachedRow.dados_json),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Tentar autorizar e registrar uso real/novo
    const { data: authorized, error: authError } = await supabaseClient.rpc('rpc_record_fipe_usage', {
      p_placa: limpaPlaca,
      p_cached: false
    })

    if (authError || !authorized) {
      throw new Error('LIMITE_MENSAL_ATINGIDO')
    }

    // 3. Consulta Real na API Brasil
    console.log(`FIPE: [EDGE] Consultando API Brasil para placa: ${limpaPlaca}`)
    const response = await fetch('https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_BRASIL_TOKEN}`
      },
      body: JSON.stringify({
        tipo: 'fipe-chassi',
        placa: limpaPlaca,
        homolog: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Erro na API Brasil:', errorData)

      if (response.status === 402 || (errorData.message && errorData.message.toLowerCase().includes('saldo'))) {
        throw new Error('SALDO_SISTEMA_INSUFICIENTE')
      }
      throw new Error(errorData.message || 'Falha ao consultar a placa na API Brasil.')
    }

    const apiData = await response.json()
    
    if (apiData.error) {
      throw new Error(apiData.message || 'A API retornou erro para esta consulta.')
    }

    // 4. Salvar no Cache Global
    if (apiData.data?.resultados?.[0]) {
      const result = apiData.data.resultados[0]
      // Usamos o Service Role ou o cliente atual para salvar o cache? 
      // Como o cache é global, idealmente qualquer um pode salvar.
      await supabaseClient.from('fipe_api_cache').upsert({
        placa: limpaPlaca,
        dados_json: apiData,
        mes_referencia: result.mesReferencia || mesAtual,
        updated_at: new Date().toISOString()
      })
    }

    return new Response(
      JSON.stringify(apiData),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro na Edge Function consulta-veiculo:', error)
    
    let message = error.message
    let status = 400

    if (message === 'LIMITE_MENSAL_ATINGIDO') {
      message = 'Você atingiu o limite de 100 consultas mensais da sua loja.'
    } else if (message === 'SALDO_SISTEMA_INSUFICIENTE') {
      message = 'O sistema está em manutenção de saldo. Tente novamente mais tarde.'
    }

    return new Response(
      JSON.stringify({ error: true, message }),
      { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
