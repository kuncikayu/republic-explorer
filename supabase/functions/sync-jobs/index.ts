import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_BASE = 'https://rest.republicai.io'
const MAX_BATCHES = 5; // Fetch up to 500 jobs per execution to avoid timeout

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("🚀 Edge Function: Starting Robust Sync...")

    // 1. Get current state
    const { data: latestInDb, error: dbError } = await supabase
      .from('compute_jobs')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)

    if (dbError) throw dbError
    const lastId = latestInDb && latestInDb.length > 0 ? latestInDb[0].id : 0
    console.log(`📡 Database last ID: ${lastId}`)

    let nextKey = null
    let totalSynced = 0
    let hasMore = true
    let batchCount = 0

    // 2. Loop to fill gaps (Max 5 batches or until lastId is met)
    while (hasMore && batchCount < MAX_BATCHES) {
      batchCount++
      let url = `${API_BASE}/republic/computevalidation/v1/jobs?pagination.limit=100&pagination.reverse=true`
      if (nextKey) url += `&pagination.key=${encodeURIComponent(nextKey)}`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      
      const data = await res.json()
      const jobs = data.jobs || []
      if (jobs.length === 0) break

      const newJobs = []
      let reachedExisting = false

      for (const j of jobs) {
        const id = parseInt(j.id, 10)
        if (id <= lastId) {
          reachedExisting = true
          break
        }
        newJobs.push({
          id,
          creator: j.creator,
          target_validator: j.target_validator,
          execution_image: j.execution_image,
          status: j.status,
          fee_amount: j.fee?.amount ? parseFloat(j.fee.amount) : 0,
          fee_denom: j.fee?.denom,
          result_hash: j.result_hash,
          updated_at: new Date().toISOString()
        })
      }

      if (newJobs.length > 0) {
        const { error: upsertError } = await supabase.from('compute_jobs').upsert(newJobs, { onConflict: 'id' })
        if (upsertError) throw upsertError
        totalSynced += newJobs.length
        console.log(`✅ Batch ${batchCount}: Synced ${newJobs.length} jobs (Range: ${newJobs[newJobs.length-1].id} - ${newJobs[0].id})`)
      }

      if (reachedExisting || !data.pagination?.next_key) {
        hasMore = false
      } else {
        nextKey = data.pagination.next_key
      }
    }

    console.log(`🏁 Sync Finished. Total new jobs added: ${totalSynced}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        total_synced: totalSynced,
        status: hasMore ? "More gaps exist (Will catch up in next run)" : "Fully synced"
      }), 
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (err) {
    console.error("❌ Sync Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
