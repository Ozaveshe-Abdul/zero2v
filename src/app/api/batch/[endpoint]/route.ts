import { waitUntil } from '@vercel/functions'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { callNINBVNApi } from '@/lib/ninbvn'
import { auditLog } from '@/lib/auditLog'

const COSTS: Record<string, number> = {
  'nin-verification': 150,
  'nin-phone': 250,
  'nin-tracking': 200,
  'nin-demography': 250,
}

const ACTION_MAP: Record<string, any> = {
  'nin-verification': 'nin_verification',
  'nin-phone': 'nin_phone_search',
  'nin-tracking': 'nin_tracking',
  'nin-demography': 'nin_demography',
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST(req: NextRequest, { params }: { params: Promise<{ endpoint: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await params;
    const costPerItem = COSTS[endpoint]

    if (!costPerItem) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 })
    }

    const { items, consent } = await req.json()

    if (!consent) {
       await auditLog({
        event: 'consent_missing_attempt',
        severity: 'warning',
        userId: user.id,
        req,
        metadata: { endpoint: `/api/batch/${endpoint}`, consent_value_received: consent },
      })
      return NextResponse.json({ error: 'Consent is required for all items in the batch.' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: 'Batch items must be an array between 1 and 50 items' }, { status: 400 })
    }

    const totalCost = items.length * costPerItem

    // Pre-flight check (deduct all credits upfront)
    const { error: deductError } = await serviceSupabase
      .rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: totalCost,
        p_description: `Batch ${endpoint.replace('-', ' ')} (${items.length} items)`,
        p_reference: `BATCH_${Date.now()}_${user.id.slice(0, 8)}`,
      })

    if (deductError) {
      return NextResponse.json(
        { error: deductError.message },
        { status: deductError.message.includes('Insufficient') ? 402 : 500 }
      )
    }

    // Create the batch job record
    const { data: batchJob, error: batchError } = await serviceSupabase
      .from('batch_jobs')
      .insert({
        user_id: user.id,
        endpoint,
        total_items: items.length,
        total_cost: totalCost,
        completed_items: 0,
        failed_items: 0,
        status: 'queued',
      })
      .select('id')
      .single()

    if (batchError || !batchJob) {
      // Refund if we failed to create the job
      await serviceSupabase.rpc('credit_wallet', {
        p_user_id: user.id,
        p_amount: totalCost,
        p_reference: `REFUND_SYS_${Date.now()}`,
        p_description: 'Refund: Batch job creation failed',
      })
      return NextResponse.json({ error: 'Failed to queue batch job' }, { status: 500 })
    }

    await auditLog({
      event: 'batch_job_created',
      severity: 'info',
      userId: user.id,
      req,
      metadata: {
        batch_id: batchJob.id,
        endpoint,
        total_items: items.length,
        total_cost: totalCost,
      },
    })

    // Start background processing without awaiting
    waitUntil(processBatchInBackground(batchJob.id, items, endpoint, user.id, costPerItem))

    return NextResponse.json({ batch_id: batchJob.id })

  } catch (err: any) {
    console.error('Batch initiate error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Background Processor Function
async function processBatchInBackground(batchId: string, items: any[], endpoint: string, userId: string, unitCost: number) {
  try {
    await auditLog({
      event: 'batch_job_started',
      severity: 'info',
      userId,
      metadata: { batch_id: batchId },
    })

    await serviceSupabase
      .from('batch_jobs')
      .update({ status: 'running', updated_at: new Date().toISOString() })
      .eq('id', batchId)

    let completedCount = 0
    let failedCount = 0

    for (const [index, payload] of items.entries()) {
      await sleep(350) // Prevent upstream rate limits

      const result = await callNINBVNApi(endpoint, payload)
      const isError = result.status === 'error' || result.status === 'failed' || result.status === 'false'

      if (isError) {
        // Refund single item
        await serviceSupabase.rpc('credit_wallet', {
          p_user_id: userId,
          p_amount: unitCost,
          p_reference: `REF_BATCH_${batchId}_${index}`,
          p_description: `Batch refund: item ${index + 1} failed`,
        })

        failedCount++
        await serviceSupabase.from('api_calls').insert({
          user_id: userId,
          action_type: ACTION_MAP[endpoint] || 'batch_item',
          label: `Batch ${endpoint}`,
          endpoint,
          request_payload: { ...payload, consent_given: true, batch_index: index },
          response_data: result,
          cost: 0,
          status: 'refunded',
          batch_id: batchId,
        })
      } else {
        completedCount++
        await serviceSupabase.from('api_calls').insert({
          user_id: userId,
          action_type: ACTION_MAP[endpoint] || 'batch_item',
          label: `Batch ${endpoint}`,
          endpoint,
          request_payload: { ...payload, consent_given: true, batch_index: index },
          response_data: result,
          report_id: result.reportID,
          cost: unitCost,
          status: 'success',
          batch_id: batchId,
        })
      }

      // Update real-time progress every item
      await serviceSupabase
        .from('batch_jobs')
        .update({
          completed_items: completedCount,
          failed_items: failedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId)
    }

    // Finalize
    await serviceSupabase
      .from('batch_jobs')
      .update({
        status: failedCount > 0 && completedCount > 0 ? 'partial' : failedCount === items.length ? 'failed' : 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)

    await auditLog({
      event: 'batch_job_completed',
      severity: 'info',
      userId,
      metadata: { batch_id: batchId, completed: completedCount, failed: failedCount },
    })

  } catch (error) {
    console.error(`Batch processing crashed for ID ${batchId}:`, error)
    await serviceSupabase
      .from('batch_jobs')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', batchId)

    await auditLog({
      event: 'batch_job_failed',
      severity: 'critical',
      userId,
      metadata: { batch_id: batchId, error: String(error) },
    })
  }
}
