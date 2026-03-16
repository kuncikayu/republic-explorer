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

    // Basic check: Allow if Authorization header matches service role key
    if (!authHeader || (serviceKey && !authHeader.includes(serviceKey))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { project, type } = await req.json()
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')

    if (!webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL not set in Supabase')
    }

    let title = ''
    let color = 0x00FF6F
    let content = ''

    switch (type) {
      case 'submit':
        title = `New Project Submission: ${project.name}`
        color = 0x00E5FF
        content = `@here New project submission awaiting review! ID: \`${project.id}\``
        break
      case 'update':
        title = `Project Update Request: ${project.name}`
        color = 0xF59E0B
        content = `@here Project update awaits! ID: \`${project.id}\``
        break
      case 'approve':
        title = `✅ Project Approved: ${project.name}`
        color = 0x00FF6F
        content = `🚀 A new project **${project.name}** has been **approved** and is now live!`
        break
      case 'decline':
        title = `❌ Project Declined: ${project.name}`
        color = 0xFF3B5C
        content = `🗑️ Project **${project.name}** has been **declined and deleted**.`
        break
      default:
        title = `Notification: ${project.name}`
    }

    const embed = {
      title: title,
      url: project.website || '',
      color: color,
      thumbnail: { url: project.logoUrl || "" },
      fields: [
        { name: "Category", value: project.category || "N/A", inline: true },
        { name: "Status", value: project.status || "N/A", inline: true },
        { name: "Metric", value: `${project.metricLabel || 'N/A'}: ${project.metricValue || 'N/A'}`, inline: true },
        { name: "Description", value: (project.shortDesc || project.fullDesc || "").substring(0, 1000) },
        { name: "Submitted By", value: `\`${project.walletAddress || 'Unknown'}\``, inline: false },
      ],
      footer: { text: `Republic Explorers • ${new Date().toLocaleString()}` },
      timestamp: new Date().toISOString()
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, embeds: [embed] })
    })

    if (!res.ok) throw new Error(`Discord error: ${await res.text()}`)

    return new Response(JSON.stringify({ success: true }), {
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
