// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url_param = new URL(req.url).searchParams.get('url')
    if (!url_param) {
      return new Response('Missing URL parameter', { status: 400, headers: corsHeaders })
    }

    const response = await fetch(url_param)
    if (!response.ok) {
      return new Response('Failed to fetch image', { status: response.status, headers: corsHeaders })
    }

    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || 'image/png'

    return new Response(blob, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (err) {
    return new Response(String(err), { status: 500, headers: corsHeaders })
  }
})
