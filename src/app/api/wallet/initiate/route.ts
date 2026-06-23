import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/paystack'
import { serviceSupabase } from '@/lib/supabase/service'
import { auditLog } from '@/lib/auditLog'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await req.json()

    if (!amount || amount < 100 || amount > 500000) {
      return NextResponse.json({ error: 'Invalid amount. Minimum is ₦100, maximum is ₦500,000' }, { status: 400 })
    }

    // Generate unique reference
    const reference = `PAY_${crypto.randomUUID()}`

    // Calculate kobo
    const amountKobo = amount * 100

    // Initialize with Paystack
    const response = await initializeTransaction({
      email: user.email!,
      amount: amountKobo,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/wallet/callback`,
      metadata: {
        user_id: user.id,
        naira_amount: amount,
      },
    })

    if (!response.status) {
      return NextResponse.json({ error: response.message || 'Failed to initialize payment' }, { status: 400 })
    }

    // Pre-insert into paystack_events to track initiation
    await serviceSupabase.from('paystack_events').insert({
      event_type: 'charge.initiated',
      reference,
      payload: { user_id: user.id, amount },
      processed: false
    })

    await auditLog({
      event: 'wallet_funding_initiated',
      severity: 'info',
      userId: user.id,
      req,
      metadata: {
        amount_naira: amount,
        paystack_reference: reference,
        initiation_source: 'web',
      },
    })

    return NextResponse.json({ authorization_url: response.data.authorization_url })

  } catch (err: any) {
    console.error('Wallet initiate error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
