import { serviceSupabase } from './supabase/service'
import { NextRequest } from 'next/server'
import { AuditEvent, AuditSeverity } from '../types/database'

interface AuditPayload {
  event: AuditEvent
  severity?: AuditSeverity
  userId?: string
  req?: NextRequest // pass the route's NextRequest to capture IP + User-Agent
  metadata?: Record<string, unknown>
}

export async function auditLog({
  event,
  severity = 'info',
  userId,
  req,
  metadata,
}: AuditPayload): Promise<void> {
  try {
    const ip = req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req?.headers.get('x-real-ip')
      ?? null

    const userAgent = req?.headers.get('user-agent') ?? null

    await serviceSupabase.from('audit_logs').insert({
      event,
      severity,
      user_id: userId ?? null,
      ip_address: ip,
      user_agent: userAgent,
      metadata: metadata ?? null,
    })
  } catch (err) {
    // Audit logging must never crash the main request flow.
    // Log to console only so operations can proceed even if auditing fails.
    console.error('[auditLog] Failed to write audit log:', err)
  }
}
