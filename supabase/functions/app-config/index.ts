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
    const authHeader = req.headers.get('Authorization')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Optional: Restricted config access could also check a specific token or key
    // For now, we'll keep it open but suggest signature verification in the future.

    const { wallet } = await req.json().catch(() => ({}));
    const adminWallet = Deno.env.get('ADMIN_WALLET');
    const isAdmin = wallet && adminWallet && wallet.toLowerCase() === adminWallet.toLowerCase();

    const config = {
      isAdmin: !!isAdmin,
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
