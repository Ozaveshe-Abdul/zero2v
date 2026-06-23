import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const BASE = 'https://api.paystack.co'

export async function initializeTransaction(params: {
  email: string
  amount: number   // in kobo
  reference: string
  callback_url: string
  metadata: Record<string, unknown>
}) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  return res.json()
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  })
  return res.json()
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (!process.env.PAYSTACK_WEBHOOK_SECRET) {
    console.error('Missing PAYSTACK_WEBHOOK_SECRET env variable');
    return false;
  }
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return hash === signature
}
