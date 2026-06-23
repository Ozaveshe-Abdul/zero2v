import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { callNINBVNApi } from '@/lib/ninbvn'

export async function GET(req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reference } = await params

    const { data: order, error: orderError } = await supabase
      .from('modification_orders')
      .select('*')
      .eq('reference_id', reference)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // If order is completed or rejected, we don't need to poll upstream
    if (order.status === 'completed' || order.status === 'rejected') {
      return NextResponse.json(order)
    }

    // Otherwise, poll upstream status
    const result = await callNINBVNApi('nin-modification-status', { referenceID: reference })

    // Determine new status (pseudo-mapping based on generic upstream response)
    let newStatus = order.status
    if (result.status === 'success' && result.orderStatus) {
      newStatus = result.orderStatus.toLowerCase() // "processing", "approved", "completed", "rejected"
    }

    if (newStatus !== order.status) {
       await serviceSupabase
         .from('modification_orders')
         .update({ status: newStatus, updated_at: new Date().toISOString() })
         .eq('id', order.id)

       // If rejected, issue refund
       if (newStatus === 'rejected') {
         await serviceSupabase.rpc('credit_wallet', {
           p_user_id: user.id,
           p_amount: order.amount_charged,
           p_reference: `REF_REJ_${reference}`,
           p_description: `Refund: Order Rejected (${reference})`
         })
       }
    }

    return NextResponse.json({ ...order, status: newStatus })

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
