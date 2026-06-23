import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/paystack'
import { serviceSupabase } from '@/lib/supabase/service'
import { auditLog } from '@/lib/auditLog'

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-paystack-signature')

    // We need the raw body as a string to verify the signature
    const rawBody = await req.text()

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      await auditLog({
        event: 'webhook_signature_invalid',
        severity: 'critical',
        req,
        metadata: {
          received_signature: signature ? signature.slice(0, 20) + '...' : 'none',
          payload_size_bytes: rawBody.length,
        },
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // Only process successful charges
    if (event.event !== 'charge.success') {
      return NextResponse.json({ message: 'Ignored event type' })
    }

    const { reference, metadata, amount } = event.data

    // Amount from Paystack is in Kobo. Convert to Naira (Credits)
    const nairaAmount = Math.floor(amount / 100)
    const userId = metadata?.user_id

    if (!userId) {
      console.error('Webhook payload missing user_id in metadata', reference)
      return NextResponse.json({ error: 'Missing user context' }, { status: 400 })
    }

    // Idempotency check: see if we already logged this event
    const { data: existingEvent, error: fetchError } = await serviceSupabase
      .from('paystack_events')
      .select('id, processed')
      .eq('reference', reference)
      .single()

    if (existingEvent && existingEvent.processed) {
      await auditLog({
        event: 'duplicate_webhook_reference',
        severity: 'warning',
        req,
        metadata: { reference },
      })
      return NextResponse.json({ message: 'Already processed' })
    }

    // If the event isn't in the table yet (e.g., webhook arrives before initiate saves it), insert it
    if (!existingEvent) {
      await serviceSupabase.from('paystack_events').insert({
        event_type: event.event,
        reference,
        payload: event.data,
        processed: false
      })
    }

    // Call Supabase RPC to atomic credit wallet
    const { error: creditError } = await serviceSupabase.rpc('credit_wallet', {
      p_user_id: userId,
      p_amount: nairaAmount,
      p_reference: reference,
      p_description: 'Wallet top-up via Paystack',
    })

    if (creditError) {
      console.error('Failed to credit wallet:', creditError)
      return NextResponse.json({ error: 'Internal database error' }, { status: 500 })
    }

    // Mark event as processed
    await serviceSupabase
      .from('paystack_events')
      .update({ processed: true })
      .eq('reference', reference)

    await auditLog({
      event: 'wallet_credited',
      severity: 'info',
      userId,
      req,
      metadata: { amount_naira: nairaAmount, paystack_reference: reference },
    })

    return NextResponse.json({ status: 'success' })
  } catch (error: any) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
