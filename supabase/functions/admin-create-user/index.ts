import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Authorization header is required')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const callerClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData.user) throw new Error('Unauthorized')

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, ativo')
      .eq('id', callerData.user.id)
      .single()

    if (profileError) throw profileError
    if (callerProfile?.role !== 'ADMIN' || callerProfile?.ativo === false) {
      throw new Error('Only active ADMIN users can create users')
    }

    const { data: callerMembership, error: membershipError } = await adminClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', callerData.user.id)
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      console.warn('Falha ao resolver organização do admin via organization_members:', membershipError.message)
    }

    const organizationId = normalizeOrgId(
      (callerMembership as any)?.organization_id ??
      (callerData.user as any)?.app_metadata?.organization_id ??
      (callerData.user as any)?.user_metadata?.organization_id
    )

    if (!organizationId) {
      throw new Error('Não foi possível identificar a organização do usuário logado.')
    }

    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()

    if (!email) throw new Error('email is required')
    if (!body.nome) throw new Error('nome is required')

    const redirectTo = String(body.redirectTo || '').trim() || undefined

    const { data: created, error: createError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        nome: body.nome,
        sobrenome: body.sobrenome,
        role: body.role ?? 'OPERADOR',
        organization_id: organizationId,
      },
    })

    if (createError) throw createError
    if (!created.user) throw new Error('User was not invited')

    if (organizationId) {
      const { error: metadataError } = await adminClient.auth.admin.updateUserById(created.user.id, {
        app_metadata: {
          ...(created.user?.app_metadata || {}),
          organization_id: organizationId,
        },
      })

      if (metadataError) {
        await adminClient.auth.admin.deleteUser(created.user.id)
        throw metadataError
      }
    }

    const { error: profileInsertError } = await adminClient
      .from('profiles')
      .upsert({
        id: created.user.id,
        organization_id: organizationId,
        email,
        nome: body.nome,
        sobrenome: body.sobrenome,
        cpf: body.cpf,
        telefone: body.telefone,
        role: body.role ?? 'OPERADOR',
        ativo: body.ativo ?? true,
        force_password_change: true,
        updated_at: new Date().toISOString(),
      })

    if (profileInsertError) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      throw profileInsertError
    }

    return new Response(JSON.stringify({
      user: {
        id: created.user.id,
        email: created.user.email,
      },
      inviteSent: true,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

function normalizeOrgId(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}
