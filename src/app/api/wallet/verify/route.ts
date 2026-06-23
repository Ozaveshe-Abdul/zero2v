import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { verifyTransaction } from '@/lib/paystack'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    // Check DB first to see if webhook already processed it
    const { data: eventRow } = await serviceSupabase
      .from('paystack_events')
      .select('processed')
      .eq('reference', reference)
      .eq('event_type', 'charge.success')
      .single()

    if (eventRow?.processed) {
      // Get the updated user balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single()

      return NextResponse.json({
        status: 'success',
        balance: profile?.wallet_balance
      })
    }

    // Fallback: Check Paystack directly if webhook is delayed
    const paystackResponse = await verifyTransaction(reference)

    if (paystackResponse.data?.status === 'success') {
       // Ideally we wait for the webhook, but we can return pending status
       // so the client keeps polling or gives a "processing" message
       return NextResponse.json({ status: 'processing', message: 'Payment confirmed by Paystack, waiting for settlement...' })
    }

    if (paystackResponse.data?.status === 'abandoned' || paystackResponse.data?.status === 'failed') {
       return NextResponse.json({ status: 'failed', message: 'Payment failed or was abandoned.' })
    }

    return NextResponse.json({ status: 'pending', message: 'Awaiting payment' })

  } catch (err: any) {
    console.error('Wallet verify error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
