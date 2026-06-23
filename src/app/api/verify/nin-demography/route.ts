import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callNINBVNApi } from '@/lib/ninbvn'
import { serviceSupabase } from '@/lib/supabase/service'
import { z } from 'zod'
import { auditLog } from '@/lib/auditLog'

const COST = 250

const schema = z.object({
  firstname: z.string().min(2).max(50),
  lastname: z.string().min(2).max(50),
  gender: z.enum(['M', 'F', 'Male', 'Female']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD'),
  consent: z.literal(true, {
    error: 'Consent is required.'
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
    if (body?.consent !== true) {
       await auditLog({
        event: 'consent_missing_attempt',
        severity: 'warning',
        userId: user.id,
        req,
        metadata: { endpoint: '/api/verify/nin-demography', consent_value_received: body.consent },
      })
    }
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { error: deductError } = await serviceSupabase
    .rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: COST,
      p_description: 'NIN Demography Search',
      p_reference: `DEMO_${Date.now()}_${user.id.slice(0, 8)}`,
    })
  if (deductError) {
    return NextResponse.json(
      { error: deductError.message },
      { status: deductError.message.includes('Insufficient') ? 402 : 500 }
    )
  }

  await auditLog({
    event: 'credits_deducted',
    userId: user.id,
    req,
    metadata: { amount: COST, reason: 'NIN Demography Search' },
  })

  // Format fields before sending
  const payload = {
    ...parsed.data,
    firstname: parsed.data.firstname.trim().toUpperCase(),
    lastname: parsed.data.lastname.trim().toUpperCase(),
    gender: parsed.data.gender.toUpperCase().startsWith('M') ? 'M' : 'F',
  }

  let result;
  try {
    result = await callNINBVNApi('nin-demography', payload);
  } catch (upstreamError: any) {
    result = { status: 'error', message: upstreamError?.message || 'Upstream connection failed' };
  }
  const consentTimestamp = new Date().toISOString()

  if (result.status === 'error' || result.status === 'failed' || result.status === 'false') {
    await serviceSupabase.rpc('credit_wallet', {
      p_user_id: user.id,
      p_amount: COST,
      p_reference: `REFUND_${Date.now()}`,
      p_description: 'Refund: NIN Demography Search failed',
    })

    await auditLog({
      event: 'wallet_refunded',
      userId: user.id,
      req,
      metadata: { amount: COST, reason: 'NIN Demography Search failed — upstream error' },
    })

    await serviceSupabase.from('api_calls').insert({
      user_id: user.id,
      action_type: 'nin_demography',
      label: 'NIN Demography Search',
      endpoint: 'nin-demography',
      request_payload: {
        ...payload,
        consent_given: true,
        consent_timestamp: consentTimestamp,
      },
      response_data: result,
      cost: 0,
      status: 'refunded',
    })

    await auditLog({
      event: 'nin_demography_failed',
      severity: 'warning',
      userId: user.id,
      req,
      metadata: {
        cost: COST,
        upstream_message: result.message,
      },
    })
    return NextResponse.json({ error: result.message || 'Search failed' }, { status: 400 })
  }

  const { data: apiCallRow } = await serviceSupabase.from('api_calls').insert({
    user_id: user.id,
    action_type: 'nin_demography',
    label: 'NIN Demography Search',
    endpoint: 'nin-demography',
    request_payload: {
      ...payload,
      consent_given: true,
      consent_timestamp: consentTimestamp,
    },
    response_data: result,
    report_id: result.reportID,
    cost: COST,
    status: 'success',
  }).select('id').single()

  await auditLog({
    event: 'nin_demography_success',
    severity: 'info',
    userId: user.id,
    req,
    metadata: {
      cost: COST,
      report_id: result.reportID,
      api_call_id: apiCallRow?.id,
      consent_timestamp: consentTimestamp,
    },
  })

  return NextResponse.json(result)
}
