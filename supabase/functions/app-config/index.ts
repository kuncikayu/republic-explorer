import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // We return configuration that should be dynamic but not necessarily secret
    // such as RPC URLs or Admin Addresses.
    // These are pulled from Supabase Secrets (Vault).
    const config = {
      ADMIN_WALLET: Deno.env.get('ADMIN_WALLET'),
      REPUBLIC_RPC_URL: Deno.env.get('REPUBLIC_RPC_URL'),
    }

    return new Response(JSON.stringify(config), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
