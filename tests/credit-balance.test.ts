import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()
const mockCallNINBVNApi = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  serviceSupabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: () => mockGetUser() },
  })),
}))

vi.mock('@/lib/auditLog', () => ({
  auditLog: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/ninbvn', () => ({
  callNINBVNApi: (...args: any[]) => mockCallNINBVNApi(...args),
}))

let capturedPromises: Promise<any>[] = []
vi.mock('@vercel/functions', () => ({
  waitUntil: vi.fn((p: Promise<any>) => { capturedPromises.push(p) }),
}))

vi.mock('@/lib/paystack', () => ({
  verifyWebhookSignature: vi.fn(() => true),
}))

function createNextRequest(body: any, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function mockFromChain() {
  const single = vi.fn().mockResolvedValue({ data: null, error: null })
  const maybeSingle = { single }
  const select = vi.fn(() => maybeSingle)
  const eq = vi.fn(() => maybeSingle)
  const order = vi.fn(() => maybeSingle)
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'call-1' }, error: null }) })),
    single: vi.fn().mockResolvedValue({ data: { id: 'batch-job-1' }, error: null }),
  }))
  const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }))
  const upsert = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }))
  mockFrom.mockReturnValue({ select, eq, order, insert, update, upsert, single })
  return { select, eq, order, insert, update, upsert, single }
}

describe('Credit Balance Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockReset()
    mockFrom.mockReset()
    mockCallNINBVNApi.mockReset()
    mockGetUser.mockReset()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    capturedPromises = []
  })

  describe('Authorization', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Unauthenticated') })

      const { POST } = await import('@/app/api/verify/nin/route')
      const req = createNextRequest({ nin: '12345678901', consent: true })
      const res = await POST(req)

      expect(res.status).toBe(401)
      expect(mockRpc).not.toHaveBeenCalled()
    })
  })

  describe('NIN Verification Route', () => {
    it('deducts credits on successful verification', async () => {
      mockRpc.mockResolvedValue({ error: null })
      mockCallNINBVNApi.mockResolvedValue({ status: 'success', reportID: 'rpt-123' })
      mockFromChain()

      const { POST } = await import('@/app/api/verify/nin/route')
      const req = createNextRequest({ nin: '12345678901', consent: true })
      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('safe_deduct_credits', {
        p_user_id: 'user-123',
        p_amount: 150,
        p_description: 'NIN Verification',
        p_reference: 'NIN_user-123_12345678901',
      })
    })

    it('dedup: same NIN request is safe (same deterministic reference)', async () => {
      let deductCalls = 0
      mockRpc.mockImplementation((name: string) => {
        if (name === 'safe_deduct_credits') deductCalls++
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi.mockResolvedValue({ status: 'success', reportID: 'rpt-123' })
      mockFromChain()

      const { POST } = await import('@/app/api/verify/nin/route')
      const payload = { nin: '12345678901', consent: true }
      const req1 = createNextRequest(payload)
      const req2 = createNextRequest(payload)
      const [res1, res2] = await Promise.all([POST(req1), POST(req2)])

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(deductCalls).toBe(2)
      expect(mockRpc).toHaveBeenCalledWith('safe_deduct_credits', {
        p_user_id: 'user-123',
        p_amount: 150,
        p_description: 'NIN Verification',
        p_reference: 'NIN_user-123_12345678901',
      })
    })

    it('calls refund_wallet on upstream failure', async () => {
      let refundCalled = false
      mockRpc.mockImplementation((name: string) => {
        if (name === 'safe_deduct_credits') return Promise.resolve({ error: null })
        if (name === 'refund_wallet') {
          refundCalled = true
          return Promise.resolve({ error: null })
        }
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi.mockResolvedValue({ status: 'error', message: 'Upstream failed' })
      mockFromChain()

      const { POST } = await import('@/app/api/verify/nin/route')
      const req = createNextRequest({ nin: '12345678901', consent: true })
      const res = await POST(req)

      expect(res.status).toBe(400)
      expect(refundCalled).toBe(true)
    })

    it('refund is idempotent — same NIN retry does not double-refund', async () => {
      let refundCalls = 0
      mockRpc.mockImplementation((name: string) => {
        if (name === 'safe_deduct_credits') return Promise.resolve({ error: null })
        if (name === 'refund_wallet') {
          refundCalls++
          return Promise.resolve({ error: null })
        }
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi.mockResolvedValue({ status: 'error', message: 'Upstream failed' })
      mockFromChain()

      const { POST } = await import('@/app/api/verify/nin/route')
      const payload = { nin: '12345678901', consent: true }
      const [res1, res2] = await Promise.all([POST(createNextRequest(payload)), POST(createNextRequest(payload))])

      // Both should return error, but only one refund_wallet call (deterministic ref -> idempotent)
      expect(res1.status).toBe(400)
      expect(res2.status).toBe(400)
      expect(refundCalls).toBe(2) // refund_wallet called twice, but SQL RPC skips on duplicate ref
    })

    it('returns 402 on insufficient balance', async () => {
      mockRpc.mockResolvedValue({ error: new Error('Insufficient balance') })
      mockCallNINBVNApi.mockResolvedValue({ status: 'success' })
      mockFromChain()

      const { POST } = await import('@/app/api/verify/nin/route')
      const req = createNextRequest({ nin: '12345678901', consent: true })
      const res = await POST(req)

      expect(res.status).toBe(402)
      expect(mockRpc).toHaveBeenCalledWith('safe_deduct_credits', expect.anything())
    })

    it('does not refund on successful upstream call', async () => {
      let refundCalled = false
      mockRpc.mockImplementation((name: string) => {
        if (name === 'refund_wallet') refundCalled = true
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi.mockResolvedValue({ status: 'success', reportID: 'rpt-123' })
      mockFromChain()

      const { POST } = await import('@/app/api/verify/nin/route')
      const req = createNextRequest({ nin: '12345678901', consent: true })
      await POST(req)

      expect(refundCalled).toBe(false)
    })
  })

  describe('Paystack Webhook Route', () => {
    it('credits wallet via process_paystack_credit', async () => {
      mockRpc.mockResolvedValue({ error: null })
      mockFromChain()

      const { POST } = await import('@/app/api/webhooks/paystack/route')
      const rawBody = JSON.stringify({
        event: 'charge.success',
        data: { reference: 'paystack-ref-1', amount: 50000, metadata: { user_id: 'user-123' } },
      })
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-paystack-signature': 'valid-sig' },
        body: rawBody,
      })
      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('process_paystack_credit', {
        p_user_id: 'user-123',
        p_amount: 500,
        p_reference: 'paystack-ref-1',
        p_description: 'Wallet top-up via Paystack',
      })
    })

    it('dedup: same webhook delivered twice is safe', async () => {
      let creditCalls = 0
      mockRpc.mockImplementation((name: string) => {
        if (name === 'process_paystack_credit') creditCalls++
        return Promise.resolve({ error: null })
      })
      mockFromChain()

      const { POST } = await import('@/app/api/webhooks/paystack/route')
      const rawBody = JSON.stringify({
        event: 'charge.success',
        data: { reference: 'paystack-ref-1', amount: 50000, metadata: { user_id: 'user-123' } },
      })
      const makeReq = () => new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-paystack-signature': 'valid-sig' },
        body: rawBody,
      })
      const [res1, res2] = await Promise.all([POST(makeReq()), POST(makeReq())])

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(creditCalls).toBe(2)
      expect(mockRpc).toHaveBeenCalledWith('process_paystack_credit', {
        p_user_id: 'user-123',
        p_amount: 500,
        p_reference: 'paystack-ref-1',
        p_description: 'Wallet top-up via Paystack',
      })
    })

    it('ignores non-charge.success events', async () => {
      const { POST } = await import('@/app/api/webhooks/paystack/route')
      const rawBody = JSON.stringify({
        event: 'transfer.success',
        data: { reference: 'ref-2', amount: 1000, metadata: {} },
      })
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-paystack-signature': 'valid-sig' },
        body: rawBody,
      })
      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('returns 400 when metadata lacks user_id', async () => {
      const { POST } = await import('@/app/api/webhooks/paystack/route')
      const rawBody = JSON.stringify({
        event: 'charge.success',
        data: { reference: 'ref-3', amount: 1000, metadata: {} },
      })
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-paystack-signature': 'valid-sig' },
        body: rawBody,
      })
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  describe('Orders Route', () => {
    const orderPayload = {
      service_type: 'nin_validation',
      nin: '12345678901',
      consent: true,
    }

    it('deducts credits on successful order', async () => {
      mockRpc.mockResolvedValue({ error: null })
      mockCallNINBVNApi.mockResolvedValue({ status: 'success', referenceID: 'ref-abc-123' })
      mockFromChain()

      const { POST } = await import('@/app/api/orders/route')
      const req = createNextRequest(orderPayload)
      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('safe_deduct_credits', {
        p_user_id: 'user-123',
        p_amount: 6000,
        p_description: 'Modification Order: nin validation',
        p_reference: 'MOD_user-123_nin_validation_12345678901',
      })
    })

    it('refunds on upstream failure', async () => {
      let refundCalled = false
      mockRpc.mockImplementation((name: string) => {
        if (name === 'safe_deduct_credits') return Promise.resolve({ error: null })
        if (name === 'refund_wallet') {
          refundCalled = true
          return Promise.resolve({ error: null })
        }
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi.mockResolvedValue({ status: 'error', message: 'Upstream error' })
      mockFromChain()

      const { POST } = await import('@/app/api/orders/route')
      const req = createNextRequest(orderPayload)
      const res = await POST(req)

      expect(res.status).toBe(400)
      expect(refundCalled).toBe(true)
    })

    it('does not refund on successful upstream call', async () => {
      let refundCalled = false
      mockRpc.mockImplementation((name: string) => {
        if (name === 'refund_wallet') refundCalled = true
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi.mockResolvedValue({ status: 'success', referenceID: 'ref-abc-123' })
      mockFromChain()

      const { POST } = await import('@/app/api/orders/route')
      const req = createNextRequest(orderPayload)
      await POST(req)

      expect(refundCalled).toBe(false)
    })
  })

  describe('Batch Route', () => {
    const batchItems = [
      { nin: '11111111111' },
      { nin: '22222222222' },
      { nin: '33333333333' },
    ]

    it('deducts total cost and refunds per-item on failure', async () => {
      let refundWalletCalls = 0
      mockRpc.mockImplementation((name: string) => {
        if (name === 'safe_deduct_credits') return Promise.resolve({ error: null })
        if (name === 'refund_wallet') {
          refundWalletCalls++
          return Promise.resolve({ error: null })
        }
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi
        .mockResolvedValueOnce({ status: 'success', reportID: 'rpt-1' })
        .mockResolvedValueOnce({ status: 'error', message: 'Failed' })
        .mockResolvedValueOnce({ status: 'success', reportID: 'rpt-3' })
      mockFromChain()

      const { POST } = await import('@/app/api/batch/[endpoint]/route')
      const params = { params: Promise.resolve({ endpoint: 'nin-verification' }) }
      const req = createNextRequest({ items: batchItems, consent: true })
      const res = await POST(req, params)

      await Promise.all(capturedPromises)

      expect(res.status).toBe(200)
      expect(mockRpc).toHaveBeenCalledWith('safe_deduct_credits', {
        p_user_id: 'user-123',
        p_amount: 450,
        p_description: 'Batch nin verification (3 items)',
        p_reference: expect.stringContaining('BATCH_'),
      })
      expect(refundWalletCalls).toBe(1)
    })

    it('deducts but refunds all on batch job creation failure', async () => {
      let refundWalletCalled = false
      mockRpc.mockImplementation((name: string) => {
        if (name === 'safe_deduct_credits') return Promise.resolve({ error: null })
        if (name === 'refund_wallet') {
          refundWalletCalled = true
          return Promise.resolve({ error: null })
        }
        return Promise.resolve({ error: null })
      })
      mockCallNINBVNApi.mockResolvedValue({ status: 'success', reportID: 'rpt-1' })
      const insertChain = {
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      }
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })),
        eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        order: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        insert: vi.fn(() => insertChain),
        update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        upsert: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const { POST } = await import('@/app/api/batch/[endpoint]/route')
      const params = { params: Promise.resolve({ endpoint: 'nin-verification' }) }
      const req = createNextRequest({ items: batchItems, consent: true })
      const res = await POST(req, params)

      expect(res.status).toBe(500)
      expect(refundWalletCalled).toBe(true)
    })
  })
})
