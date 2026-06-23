import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { callNINBVNApi } from '@/lib/ninbvn'
import { auditLog } from '@/lib/auditLog'
import { z } from 'zod'

const COSTS: Record<string, number> = {
  'nin_validation': 6000,
  'nin_name_modification': 16000,
  'nin_phone_modification': 16000,
  'nin_address_modification': 16000,
}

const schema = z.object({
  service_type: z.enum(['nin_validation', 'nin_name_modification', 'nin_phone_modification', 'nin_address_modification']),
  nin: z.string().regex(/^\d{11}$/, 'NIN must be 11 digits'),
  consent: z.literal(true),
}).passthrough()

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { service_type, consent, ...restPayload } = parsed.data
    const cost = COSTS[service_type]

    // Deduct
    const { error: deductError } = await serviceSupabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: cost,
      p_description: `Modification Order: ${service_type.replace(/_/g, ' ')}`,
      p_reference: `MOD_${Date.now()}_${user.id.slice(0,8)}`
    })

    if (deductError) return NextResponse.json({ error: deductError.message }, { status: 402 })

    // Call upstream
    const result = await callNINBVNApi('nin-modification', { service_type, ...restPayload })

    if (result.status === 'error' || result.status === 'false') {
      await serviceSupabase.rpc('credit_wallet', {
        p_user_id: user.id, p_amount: cost, p_reference: `REF_MOD_${Date.now()}`, p_description: 'Refund: Modification Order Failed'
      })
      return NextResponse.json({ error: result.message || 'Order failed' }, { status: 400 })
    }

    const referenceId = result.referenceID || `NIN_MOD_${Date.now()}`

    // Insert Order
    const { data: order } = await serviceSupabase.from('modification_orders').insert({
      user_id: user.id,
      service_type,
      reference_id: referenceId,
      amount_charged: cost,
      status: 'pending',
      request_payload: restPayload,
      response_data: result
    }).select('id').single()

    // Insert to Unified History
    await serviceSupabase.from('api_calls').insert({
      user_id: user.id,
      action_type: 'nin_modification_order',
      label: `Order: ${service_type.replace(/_/g, ' ')}`,
      endpoint: 'nin-modification',
      request_payload: restPayload,
      response_data: result,
      report_id: referenceId,
      cost,
      status: 'success'
    })

    await auditLog({
      event: 'modification_order_submitted',
      severity: 'info',
      userId: user.id,
      metadata: { service_type, amount: cost, reference_id: referenceId, order_id: order?.id }
    })

    return NextResponse.json({ success: true, reference: referenceId })

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
