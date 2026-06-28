import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callNINBVNApi } from '@/lib/ninbvn'
import { serviceSupabase } from '@/lib/supabase/service'
import { z } from 'zod'
import { auditLog } from '@/lib/auditLog'
import { getErrorMessage } from '@/types'
import logger from '@/lib/logger'

const COST = 150

const schema = z.object({
  nin: z.string().regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
  consent: z.literal(true, {
    error: 'Consent is required. The subject must have explicitly agreed to this verification.'
  }),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    // Check if it's a consent error for logging
    if (body?.consent !== true) {
       await auditLog({
        event: 'consent_missing_attempt',
        severity: 'warning',
        userId: user.id,
        req,
        metadata: { endpoint: '/api/verify/nin', consent_value_received: body.consent },
      })
    }
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Deduct credits (idempotent — safe on retry with same NIN)
  const { error: deductError } = await serviceSupabase
    .rpc('safe_deduct_credits', {
      p_user_id: user.id,
      p_amount: COST,
      p_description: 'NIN Verification',
      p_reference: `NIN_${user.id}_${parsed.data.nin}`,
    })
  if (deductError) {
    return NextResponse.json(
      { error: deductError.message },
      { status: deductError.message.includes('Insufficient') ? 402 : 500 }
    )
  }

  // Log successful deduction
  await auditLog({
    event: 'credits_deducted',
    userId: user.id,
    req,
    metadata: { amount: COST, reason: 'NIN Verification' },
  })

  // Call upstream
  let result;
  try {
    result = await callNINBVNApi('nin-verification', parsed.data);
  } catch (upstreamError: unknown) {
    result = { status: 'error', message: getErrorMessage(upstreamError) };
  }
  const consentTimestamp = new Date().toISOString()

  if (result.status === 'error' || result.status === 'failed' || result.status === 'false') {
    // Refund (idempotent — deterministic reference tied to original debit)
    await serviceSupabase.rpc('refund_wallet', {
      p_user_id: user.id,
      p_amount: COST,
      p_reference: `REFUND_NIN_${user.id}_${parsed.data.nin}`,
      p_description: 'Refund: NIN Verification failed',
    })

    // Log refund
    await auditLog({
      event: 'wallet_refunded',
      userId: user.id,
      req,
      metadata: { amount: COST, reason: 'NIN Verification failed — upstream error' },
    })

    // Log failed call
    await serviceSupabase.from('api_calls').insert({
      user_id: user.id,
      action_type: 'nin_verification',
      label: 'NIN Verification',
      endpoint: 'nin-verification',
      request_payload: {
        nin: parsed.data.nin,
        consent_given: true,
        consent_timestamp: consentTimestamp,
      },
      response_data: result,
      cost: 0,  // refunded
      status: 'refunded',
    })

    await auditLog({
      event: 'nin_verification_failed',
      severity: 'warning',
      userId: user.id,
      req,
      metadata: {
        nin_suffix: `****${parsed.data.nin.slice(-4)}`,
        cost: COST,
        upstream_message: result.message,
      },
    })
    return NextResponse.json({ error: result.message || 'Verification failed' }, { status: 400 })
  }

  // Log successful call
  const { data: apiCallRow, error: insertError } = await serviceSupabase.from('api_calls').insert({
    user_id: user.id,
    action_type: 'nin_verification',
    label: 'NIN Verification',
    endpoint: 'nin-verification',
    request_payload: {
      nin: parsed.data.nin,
      consent_given: true,
      consent_timestamp: consentTimestamp,
    },
    response_data: result,
    report_id: result.reportID,
    cost: COST,
    status: 'success',
  }).select('id').single()

  if (insertError) {
    logger.error('Failed to insert api_call record', insertError)
  }

  await auditLog({
    event: 'nin_verification_success',
    severity: 'info',
    userId: user.id,
    req,
    metadata: {
      nin_suffix: `****${parsed.data.nin.slice(-4)}`,
      cost: COST,
      report_id: result.reportID,
      api_call_id: apiCallRow?.id,
      consent_timestamp: consentTimestamp,
    },
  })

  return NextResponse.json(result)
}
