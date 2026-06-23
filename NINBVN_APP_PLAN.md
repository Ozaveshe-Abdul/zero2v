# NIN Verification App — Full Implementation Plan
**Stack:** Next.js 14 (App Router) · Supabase · Paystack · Tailwind CSS · TypeScript

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [API Inventory & Credit Pricing](#2-api-inventory--credit-pricing)
3. [Batch Processing Strategy](#3-batch-processing-strategy)
4. [Architecture Overview](#4-architecture-overview)
5. [Database Schema (Supabase)](#5-database-schema-supabase)
6. [Security Model](#6-security-model)
7. [Phase 1 — Project Scaffold & Auth](#phase-1--project-scaffold--auth)
8. [Phase 2 — Supabase Schema & RLS](#phase-2--supabase-schema--rls)
9. [Phase 3 — Wallet & Paystack Integration](#phase-3--wallet--paystack-integration)
10. [Phase 4 — API Route Handlers (Backend Proxy)](#phase-4--api-route-handlers-backend-proxy)
11. [Phase 5 — Core Verification UI](#phase-5--core-verification-ui)
12. [Phase 6 — Batch Processing UI & Engine](#phase-6--batch-processing-ui--engine)
13. [Phase 7 — NIN Modification Orders](#phase-7--nin-modification-orders)
14. [Phase 8 — Dashboard & Transaction History](#phase-8--dashboard--transaction-history)
15. [Phase 9 — Security Hardening](#phase-9--security-hardening)
16. [Phase 10 — Testing & QA](#phase-10--testing--qa)
17. [Environment Variables Reference](#environment-variables-reference)
18. [File & Folder Structure](#file--folder-structure)

---

## 1. Product Overview

A mobile-first Next.js web app that lets Nigerian businesses and individuals verify NIN identities. Users fund a naira wallet via Paystack; every API call deducts the equivalent credit cost (1 Naira = 1 Credit). Users always see their balance displayed in Naira (₦), but internally credits are whole integers equal to naira. Batch processing is available on all endpoints — natively where the upstream API supports it, or sequentially handled behind the scenes where it does not.

### Key User Flows
- Register / Login → Fund Wallet → Run Verifications → Download Results
- Submit NIN Modification Order → Track Order Status
- View transaction history and per-call audit trail

---

## 2. API Inventory & Credit Pricing

All pricing sourced from the CheckMyNINBVN documentation. Credits = Naira 1:1.

| Feature | Endpoint | Method | Cost per request | Batch support (upstream) | Batch strategy |
|---|---|---|---|---|---|
| NIN Verification | `/api/nin-verification` | POST | ₦150 | ❌ | Sequential (manual) |
| NIN Phone Search | `/api/nin-phone` | POST | ₦250 | ❌ | Sequential (manual) |
| NIN Tracking | `/api/nin-tracking` | POST | ₦200 | ❌ | Sequential (manual) |
| NIN Demography | `/api/nin-demography` | POST | ₦250 | ❌ | Sequential (manual) |
| Account Balance | `/api/balance` | GET | Free | N/A | N/A |
| NIN Modification | `/api/nin-modification` | POST | ₦6,000–₦16,000 | ❌ | Sequential (manual) |
| Order Status | `/api/nin-modification-status` | GET/POST | Free | N/A | N/A |

> **Note:** BVN Verification and BVN Phone Search are excluded from this app per product decision.

### Modification Order Pricing Detail

| Service Type | Cost |
|---|---|
| `nin_name_modification` | ₦16,000 |
| `nin_phone_modification` | ₦16,000 |
| `nin_address_modification` | ₦16,000 |
| `nin_validation` | ₦6,000 |

---

## 3. Batch Processing Strategy

Since none of the upstream endpoints natively support batch requests, all batch operations are handled server-side using a sequential queue with rate limiting and per-item result tracking.

### Batch Engine Design (server-side)
```
User submits N items → Server validates total cost against wallet balance →
Deducts full cost upfront (reserves) → Processes items one-by-one with 300ms
delay between requests → Streams progress to client via Server-Sent Events (SSE)
or polling → Refunds any failed items → Returns full result set
```

### Batch UI Behavior
- User pastes or uploads a CSV of identifiers (NINs, phones, etc.)
- App shows per-item cost × count = total cost preview before submission
- Live progress bar shows "X of N complete"
- Per-item status: ✅ Found / ❌ Failed / ⏳ Pending
- Download results as CSV when complete
- Partial results always downloadable mid-run

### Endpoints that will expose Batch UI
| Endpoint | Batch Input Field | Max per batch |
|---|---|---|
| NIN Verification | NIN numbers (11 digits each) | 50 |
| NIN Phone Search | Phone numbers | 50 |
| NIN Tracking | Tracking IDs | 50 |
| NIN Demography | CSV rows (firstname, lastname, gender, dob) | 20 |
| NIN Modification | One order per row (name/phone/address) | 10 |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Next.js App (Vercel)            │
│                                             │
│  /app (pages)          /app/api (routes)    │
│  ├── auth/             ├── verify/          │
│  ├── dashboard/        ├── wallet/          │
│  ├── verify/           ├── batch/           │
│  ├── batch/            ├── orders/          │
│  ├── orders/           └── webhooks/        │
│  └── history/              └── paystack/    │
│                                             │
│  Middleware: auth session check, rate limit  │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
┌────▼────┐        ┌──────▼──────────────────┐
│Supabase │        │ CheckMyNINBVN External   │
│         │        │ API (proxied, never      │
│ Auth    │        │ exposed to client)       │
│ DB      │        └─────────────────────────┘
│ RLS     │
│ Storage │        ┌─────────────────────────┐
└─────────┘        │ Paystack                │
                   │ (Payments + Webhooks)   │
                   └─────────────────────────┘
```

### Key Architectural Decisions
- **The CheckMyNINBVN API key never leaves the server.** All verification calls go through Next.js API routes that add the key server-side.
- **Wallet balance lives in Supabase**, not Paystack. Paystack is only used for funding; balance tracking is internal.
- **Every API call is atomic:** deduct credits → call upstream API → log result. If upstream fails, credits are refunded in the same DB transaction.
- **Supabase RLS** ensures users can only read/write their own records.

---

## 5. Database Schema (Supabase)

### Table: `profiles`
Extends Supabase `auth.users`.

```sql
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text unique not null,
  phone         text,
  wallet_balance integer not null default 0,  -- stored in kobo-equivalent credits (whole naira)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

### Table: `transactions`
Every wallet credit or debit.

```sql
create type transaction_type as enum ('credit', 'debit', 'refund');

create table transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  type            transaction_type not null,
  amount          integer not null,             -- in naira/credits
  balance_before  integer not null,
  balance_after   integer not null,
  description     text,
  reference       text unique,                  -- Paystack ref or internal ref
  metadata        jsonb,
  created_at      timestamptz default now()
);
```

### Table: `api_calls`
Audit trail for every verification call, batch item, and modification order submission. This is the single source of truth for all history views.

```sql
create type api_call_status as enum ('success', 'error', 'refunded');

create type action_type as enum (
  'nin_verification',
  'nin_phone_search',
  'nin_tracking',
  'nin_demography',
  'nin_modification_order',
  'batch_item'
);

create table api_calls (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  action_type     action_type not null,         -- human-readable category
  endpoint        text not null,                -- e.g. 'nin-verification'
  label           text,                         -- display label e.g. 'NIN Verification'
  request_payload jsonb,                        -- sanitised (no API keys, includes consent_timestamp)
  response_data   jsonb,                        -- full response cached
  report_id       text,                         -- reportID from upstream
  cost            integer not null,             -- credits deducted (0 if refunded)
  status          api_call_status default 'success',
  batch_id        uuid references batch_jobs(id), -- null if not part of a batch
  created_at      timestamptz default now()
);

-- Index for fast per-user history queries with filters
create index api_calls_user_created on api_calls(user_id, created_at desc);
create index api_calls_action_type  on api_calls(user_id, action_type);
create index api_calls_batch        on api_calls(batch_id) where batch_id is not null;
```

### Table: `batch_jobs`
Tracks multi-item batch runs.

```sql
create type batch_status as enum ('queued', 'running', 'completed', 'partial', 'failed');

create table batch_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  endpoint        text not null,
  total_items     integer not null,
  completed_items integer default 0,
  failed_items    integer default 0,
  total_cost      integer not null,
  status          batch_status default 'queued',
  result_url      text,                         -- Supabase Storage URL for CSV
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### Table: `modification_orders`
Tracks NIN modification submissions. **Every submitted order also writes a row to `api_calls`** with `action_type = 'nin_modification_order'` so it appears in unified history.

```sql
create type order_status as enum ('pending', 'processing', 'approved', 'completed', 'rejected');

create table modification_orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  service_type    text not null,
  reference_id    text unique not null,         -- from upstream response
  amount_charged  integer not null,
  status          order_status default 'pending',
  request_payload jsonb,
  response_data   jsonb,
  submitted_at    timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### Table: `paystack_events`
Raw webhook log for Paystack events (idempotency).

```sql
create table paystack_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,
  reference       text unique not null,
  payload         jsonb not null,
  processed       boolean default false,
  created_at      timestamptz default now()
);
```

---

### Table: `audit_logs`
**Internal only — never exposed to users or rendered in the UI.** This table is the platform's security and compliance backbone. Every sensitive action across the entire platform writes a row here. Access is exclusively through the Supabase dashboard by the platform operator.

```sql
create type audit_severity as enum ('info', 'warning', 'critical');

create type audit_event as enum (
  -- Auth events
  'user_registered',
  'user_login',
  'user_login_failed',
  'user_logout',
  'password_reset_requested',
  'password_reset_completed',
  'session_expired',

  -- Wallet events
  'wallet_funding_initiated',
  'wallet_funding_completed',
  'wallet_funding_failed',
  'wallet_credited',
  'wallet_debited',
  'wallet_refunded',
  'credits_deducted',

  -- Verification events
  'nin_verification_requested',
  'nin_verification_success',
  'nin_verification_failed',
  'nin_phone_search_requested',
  'nin_phone_search_success',
  'nin_phone_search_failed',
  'nin_tracking_requested',
  'nin_tracking_success',
  'nin_tracking_failed',
  'nin_demography_requested',
  'nin_demography_success',
  'nin_demography_failed',

  -- Batch events
  'batch_job_created',
  'batch_job_started',
  'batch_job_completed',
  'batch_job_failed',
  'batch_item_success',
  'batch_item_failed',
  'batch_item_refunded',

  -- Modification order events
  'modification_order_submitted',
  'modification_order_status_checked',
  'modification_order_refunded',

  -- Export events
  'history_exported_pdf',
  'history_exported_csv',
  'wallet_statement_exported',
  'order_receipt_exported',
  'batch_report_exported',

  -- Security events
  'rate_limit_hit',
  'insufficient_balance_attempt',
  'consent_missing_attempt',        -- request blocked for missing consent
  'invalid_nin_format_attempt',     -- repeated bad input (possible probing)
  'suspicious_phone_query_pattern', -- same user querying many different phones
  'unauthorized_api_access',        -- unauthenticated request to protected route
  'webhook_signature_invalid',      -- forged Paystack webhook attempt
  'duplicate_webhook_reference',    -- replay attack attempt

  -- Admin/system events
  'api_key_used',                   -- every upstream API call (provider-level audit)
  'supabase_service_role_used'      -- every time service role client is invoked
);

create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  event           audit_event not null,
  severity        audit_severity not null default 'info',
  user_id         uuid references profiles(id) on delete set null,
  ip_address      inet,
  user_agent      text,
  metadata        jsonb,            -- event-specific context (see below)
  created_at      timestamptz default now()
);

-- Indexes for fast operator queries
create index audit_logs_event      on audit_logs(event, created_at desc);
create index audit_logs_user       on audit_logs(user_id, created_at desc);
create index audit_logs_severity   on audit_logs(severity, created_at desc);
create index audit_logs_ip         on audit_logs(ip_address, created_at desc);
create index audit_logs_created    on audit_logs(created_at desc);
```

**RLS on audit_logs — total lockout for all users:**
```sql
alter table audit_logs enable row level security;
-- No user-facing policies. Zero. Not even read.
-- Accessible only via Supabase dashboard (service role) or direct DB connection.
-- No API route exposes this table to any client.
```

**Metadata shape per event type (what goes in the `metadata` jsonb column):**

```typescript
// nin_verification_requested / _success / _failed
{
  nin_suffix: "****8901",          // last 4 only — never log full NIN
  endpoint: "nin-verification",
  cost: 150,
  report_id: "NIN_251021154942",  // present on success only
  upstream_status: "success" | "error",
  upstream_message: string,        // error message if failed
  api_call_id: uuid,               // links to api_calls table
  consent_timestamp: string,
}

// nin_phone_search_requested / _success / _failed
{
  phone_suffix: "****5678",        // last 4 only — never log full phone
  cost: 250,
  report_id: string,
  upstream_status: string,
  api_call_id: uuid,
  consent_timestamp: string,
}

// wallet_funding_initiated
{
  amount_naira: 2000,
  paystack_reference: "PAY_abc123",
  initiation_source: "web",
}

// wallet_credited
{
  amount_naira: 2000,
  paystack_reference: "PAY_abc123",
  balance_before: 1250,
  balance_after: 3250,
}

// wallet_debited / credits_deducted
{
  amount: 150,
  reason: "NIN Verification",
  balance_before: 3250,
  balance_after: 3100,
  api_call_id: uuid,
}

// wallet_refunded
{
  amount: 150,
  reason: "NIN Verification failed — upstream error",
  balance_before: 3100,
  balance_after: 3250,
  original_api_call_id: uuid,
}

// batch_job_created
{
  batch_id: uuid,
  endpoint: "nin-verification",
  total_items: 12,
  total_cost: 1800,
  balance_before: 5000,
  balance_after: 3200,
}

// batch_item_success / _failed / _refunded
{
  batch_id: uuid,
  item_index: 3,
  identifier_suffix: "****8901",
  cost: 150,
  upstream_status: string,
}

// modification_order_submitted
{
  service_type: "nin_name_modification",
  amount: 16000,
  reference_id: "MOD_abc123",
  order_id: uuid,
  consent_timestamp: string,
}

// rate_limit_hit
{
  endpoint: "/api/verify/nin",
  limit: "30/minute",
  current_count: 31,
  window_start: string,
}

// insufficient_balance_attempt
{
  endpoint: "/api/verify/nin",
  required: 150,
  available: 80,
}

// consent_missing_attempt
{
  endpoint: "/api/verify/nin",
  consent_value_received: false | null | undefined,
}

// suspicious_phone_query_pattern
{
  unique_phones_queried_last_hour: 47,
  threshold: 20,
  flagged_at: string,
}

// webhook_signature_invalid
{
  received_signature: "sha512=...",  // log it for forensics
  expected_prefix: "sha512=",
  payload_size_bytes: 512,
}

// duplicate_webhook_reference
{
  reference: "PAY_abc123",
  first_processed_at: string,
  attempted_again_at: string,
}

// history_exported_pdf / _csv
{
  record_count: 23,
  filter_applied: { action_type: "nin_verification", date_from: "...", date_to: "..." },
  export_method: "client" | "server",
}

// api_key_used
{
  endpoint: "nin-verification",
  provider: "checkmyninbvn",
  response_status: "success" | "error",
  latency_ms: 342,
}
```

---

### Audit Logger Helper: `src/lib/auditLog.ts`

Single function used everywhere in API routes. Always called with `serviceSupabase` — never the user-scoped client.

```typescript
import { serviceSupabase } from '@/lib/supabase/service'
import { NextRequest } from 'next/server'

type AuditEvent = Database['public']['Enums']['audit_event']
type AuditSeverity = Database['public']['Enums']['audit_severity']

interface AuditPayload {
  event: AuditEvent
  severity?: AuditSeverity
  userId?: string
  req?: NextRequest          // pass the route's NextRequest to capture IP + UA
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
    // Audit logging must never crash the main request
    // Log to console only (never rethrow)
    console.error('[auditLog] Failed to write audit log:', err)
  }
}
```

**Usage in every route handler:**

```typescript
// After successful NIN verification:
await auditLog({
  event: 'nin_verification_success',
  severity: 'info',
  userId: user.id,
  req,
  metadata: {
    nin_suffix: `****${parsed.data.nin.slice(-4)}`,
    cost: COST,
    report_id: result.reportID,
    api_call_id: apiCallRow.id,
    consent_timestamp: consentTimestamp,
  },
})

// After failed verification (before refund):
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

// On missing consent (blocked before any DB call):
await auditLog({
  event: 'consent_missing_attempt',
  severity: 'warning',
  userId: user.id,
  req,
  metadata: { endpoint: '/api/verify/nin', consent_value_received: body.consent },
})

// On rate limit hit:
await auditLog({
  event: 'rate_limit_hit',
  severity: 'warning',
  userId: user.id,
  req,
  metadata: { endpoint: '/api/verify/nin', limit: '30/minute', current_count: count },
})

// On invalid Paystack webhook signature:
await auditLog({
  event: 'webhook_signature_invalid',
  severity: 'critical',
  req,
  metadata: { received_signature: sig.slice(0, 20) + '...', payload_size_bytes: body.length },
})
```

---

### What is NEVER logged in audit_logs

To prevent the audit log itself from becoming a liability:

- Full NIN numbers (always suffix only: `****8901`)
- Full phone numbers (always suffix only: `****5678`)
- Full names of verified subjects
- Passwords or auth tokens
- Full Paystack webhook payloads (only reference + event type)
- Full API responses (those go in `api_calls.response_data` with RLS)
- API keys

The audit log contains **who did what and when**, not **what the data was**.

---

### RLS Policies

```sql
-- profiles: users can only read/update their own row
alter table profiles enable row level security;
create policy "own profile" on profiles
  using (auth.uid() = id);

-- transactions: users can only see their own
alter table transactions enable row level security;
create policy "own transactions" on transactions
  using (auth.uid() = user_id);

-- api_calls: users can only see their own
alter table api_calls enable row level security;
create policy "own api_calls" on api_calls
  using (auth.uid() = user_id);

-- batch_jobs: users can only see their own
alter table batch_jobs enable row level security;
create policy "own batch_jobs" on batch_jobs
  using (auth.uid() = user_id);

-- modification_orders: users can only see their own
alter table modification_orders enable row level security;
create policy "own modification_orders" on modification_orders
  using (auth.uid() = user_id);

-- paystack_events: no direct user access (server only via service role)
alter table paystack_events enable row level security;
-- no user-facing policy; accessed only via service_role key in API routes
```

### Supabase Functions (Stored Procedures)

```sql
-- Atomic: deduct credits and log transaction in one call
create or replace function deduct_credits(
  p_user_id uuid,
  p_amount   integer,
  p_description text,
  p_reference text
) returns void language plpgsql security definer as $$
declare
  v_balance integer;
begin
  select wallet_balance into v_balance
    from profiles where id = p_user_id for update;

  if v_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  update profiles
    set wallet_balance = wallet_balance - p_amount,
        updated_at = now()
    where id = p_user_id;

  insert into transactions(user_id, type, amount, balance_before, balance_after, description, reference)
    values (p_user_id, 'debit', p_amount, v_balance, v_balance - p_amount, p_description, p_reference);
end;
$$;

-- Atomic: credit wallet (called after verified Paystack webhook)
create or replace function credit_wallet(
  p_user_id uuid,
  p_amount   integer,
  p_reference text,
  p_description text
) returns void language plpgsql security definer as $$
declare
  v_balance integer;
begin
  select wallet_balance into v_balance
    from profiles where id = p_user_id for update;

  update profiles
    set wallet_balance = wallet_balance + p_amount,
        updated_at = now()
    where id = p_user_id;

  insert into transactions(user_id, type, amount, balance_before, balance_after, description, reference)
    values (p_user_id, 'credit', p_amount, v_balance, v_balance + p_amount, p_description, p_reference);
end;
$$;
```

---

## 6. Security Model

### API Key Protection
- `CHECKMYNINBVN_API_KEY` stored in `.env.local` / Vercel environment variables only
- Never imported in any `app/` page or client component — only in `app/api/` route handlers
- ESLint rule to catch accidental client-side import: `no-restricted-imports`

### Authentication
- Supabase Auth (email+password + optionally Google OAuth)
- Session stored in HTTP-only cookies via `@supabase/ssr`
- Next.js middleware validates session on every `/dashboard`, `/verify`, `/batch`, `/orders` route
- Unauthenticated requests redirected to `/auth/login`

### Wallet & Credit Safety
- All credit deductions use the `deduct_credits` Supabase stored procedure (atomic, row-level lock)
- Pre-flight balance check before any API call — request rejected if insufficient balance
- Paystack webhook signature verified with `PAYSTACK_WEBHOOK_SECRET` using HMAC-SHA512 before crediting wallet
- Idempotency: webhook events stored in `paystack_events` table; duplicate `reference` values ignored
- Batch jobs pre-reserve the full cost before any item is processed; per-item refunds issued for failures

### Rate Limiting
- Next.js middleware implements per-user rate limiting using Supabase (sliding window, stored in a `rate_limits` table or Redis if available)
- Limits:
  - Single verification: 30 requests/minute per user
  - Batch jobs: 2 concurrent batch jobs per user
  - Wallet funding: 5 initiations/hour per user

### Input Validation
- All request bodies validated with `zod` schemas before any DB or upstream API call
- NIN: exactly 11 digits, numeric only
- Phone: Nigerian format (07x, 08x, 09x, 11 digits)
- Tracking ID: alphanumeric, max 20 chars
- Demography fields: stripped and uppercased to match NIMC format
- CSV batch uploads: parsed and validated row-by-row; invalid rows rejected with error list before submission

### Consent Enforcement

Consent is a **legal requirement** under the NDPR (Nigeria Data Protection Regulation), not just an API field. The platform uses a two-tier consent model:

**Tier 1 — Platform-level (once, at signup)**
Users agree to Terms of Service containing a clause stating they are responsible for obtaining the explicit consent of any individual whose data they submit. This shifts liability for third-party lookups to the operator.

**Tier 2 — Per-request (every form submission)**
Every verification form has a consent checkbox that:
- Is **never pre-checked** (`defaultChecked={false}` always explicit)
- Uses specific, non-generic language: *"I confirm the individual whose information I am submitting has explicitly consented to this verification"*
- Blocks form submission when unchecked (submit button disabled)
- Is validated server-side — the backend schema requires `consent: true` and rejects requests where it is absent or false

**What the backend does with consent:**
The backend does NOT blindly hardcode `consent: true`. It:
1. Validates that the client sent `consent: true` in the request body (Zod `z.literal(true)`)
2. Rejects the request with 400 if consent is missing or false
3. Only after validation passes does it add `consent: true` to the upstream API call
4. Logs `consent_given: true` and `consent_timestamp` to `api_calls.request_payload` as an audit trail

**What is never done:**
- `consent: true` is never hardcoded without schema validation
- The consent checkbox is never pre-filled or auto-checked on re-renders
- Batch jobs require a single consent checkbox that explicitly covers all items in the batch, with item count shown in the label: *"I confirm all 12 individuals listed have consented to this verification"*

### Response Data Security
- API responses (including base64 photos) stored in `api_calls.response_data` — accessible only to the owning user via RLS
- No PII ever logged to console in production
- Photos never stored in Supabase Storage — returned inline to client only, cached in-session

### CORS & Headers
- API routes set strict CORS; no wildcard origins
- `Content-Security-Policy` header set in `next.config.ts`
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` headers

---

## Phase 1 — Project Scaffold & Auth

### 1.1 Init Project
```bash
npx create-next-app@latest ninbvn-app \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd ninbvn-app
npm install @supabase/supabase-js @supabase/ssr zod lucide-react
npm install -D @types/node
```

### 1.2 Install Additional Dependencies
```bash
npm install react-hot-toast papaparse       # toast notifications, CSV parse
npm install @tanstack/react-query           # data fetching + caching
npm install clsx tailwind-merge             # conditional classnames
npm install date-fns                        # date formatting
npm install jspdf jspdf-autotable          # client-side PDF generation
npm install pdfkit                          # server-side PDF generation (large exports)
npm install -D @types/papaparse @types/pdfkit
```

### 1.3 Supabase Client Setup

**`src/lib/supabase/client.ts`** — browser client
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — server client (API routes + Server Components)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

**`src/lib/supabase/service.ts`** — service role client (webhooks only, server-side)
```typescript
import { createClient } from '@supabase/supabase-js'

export const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 1.4 Middleware

**`src/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/verify', '/batch', '/orders', '/history']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PATHS.some(p => path.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
```

### 1.5 Auth Pages
- `app/auth/login/page.tsx` — email+password sign in form
- `app/auth/register/page.tsx` — registration + auto-creates profile row
- `app/auth/callback/route.ts` — Supabase OAuth callback handler
- `app/auth/forgot-password/page.tsx`
- `app/auth/reset-password/page.tsx`

After Supabase `signUp`, use a **Supabase Database Trigger** to auto-insert into `profiles`:
```sql
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

## Phase 2 — Supabase Schema & RLS

### Steps
1. Create a new Supabase project (free tier is fine for dev)
2. Run all SQL from [Section 5](#5-database-schema-supabase) in the Supabase SQL editor in order:
   - Enums first (including `audit_event` and `audit_severity`)
   - Tables next
   - RLS policies
   - Stored procedures / functions
   - Triggers
3. Enable **Realtime** on `batch_jobs` table (for live progress streaming to client)
4. Create a Supabase Storage bucket named `batch-results` with private access (users access via signed URLs)
5. Add Storage RLS: users can only read files under their own `user_id/` prefix
6. Confirm `audit_logs` has **zero RLS policies** — operator verifies this by checking the Supabase Auth Policies panel shows "No policies" for that table

### Supabase Storage Policy for batch-results
```sql
create policy "user owns their batch results"
on storage.objects for select
using (
  bucket_id = 'batch-results' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Phase 3 — Wallet & Paystack Integration

### 3.1 How the Wallet Works (for users)
- Users see their balance as **₦ (Naira)** everywhere in the UI
- Internally, `wallet_balance` is an integer representing whole naira = credits (1:1)
- When a user funds ₦1,000 via Paystack, they receive 1,000 credits
- When they run NIN Verification (₦150), 150 credits are deducted
- The word "credit" is used in tooltips/FAQs to explain the mechanics, but the dashboard always shows ₦

### 3.2 Paystack Flow

**Initiate Payment** (`POST /api/wallet/initiate`)
1. Validate amount (minimum ₦100, maximum ₦500,000)
2. Check rate limit (5 funding attempts/hour)
3. Call Paystack `POST https://api.paystack.co/transaction/initialize`
   - `email`: user's email
   - `amount`: amount in **kobo** (multiply naira × 100)
   - `reference`: generate unique `PAY_<uuid>` reference
   - `callback_url`: `https://yourdomain.com/wallet/callback`
   - `metadata`: `{ user_id, naira_amount }`
4. Store pending reference in `paystack_events` (processed: false)
5. Return `authorization_url` to client → redirect user to Paystack checkout

**Paystack Webhook** (`POST /api/webhooks/paystack`)
1. Verify `x-paystack-signature` header using HMAC-SHA512 with `PAYSTACK_WEBHOOK_SECRET`
2. Parse event body; check `event === 'charge.success'`
3. Look up reference in `paystack_events`; if `processed: true`, return 200 (idempotent)
4. Verify amount via Paystack `GET /transaction/verify/:reference`
5. Convert kobo → naira (divide by 100, floor to whole number)
6. Call `credit_wallet(user_id, naira_amount, reference, 'Wallet top-up via Paystack')`
7. Mark `paystack_events` row as `processed: true`
8. Return HTTP 200

**Wallet Callback Page** (`/wallet/callback`)
- Receives `?reference=` query param from Paystack redirect
- Shows loading state while polling `/api/wallet/verify?reference=`
- On success: shows ₦ amount credited, updated balance
- On failure: shows error message with retry link

### 3.3 API Routes

**`app/api/wallet/initiate/route.ts`**
```typescript
// POST — body: { amount: number }
// Validates session, validates amount, calls Paystack initialize, returns { authorization_url }
```

**`app/api/wallet/verify/route.ts`**
```typescript
// GET — query: ?reference=PAY_xxx
// Checks paystack_events.processed for this reference; returns { status, balance }
```

**`app/api/webhooks/paystack/route.ts`**
```typescript
// POST — raw body needed for HMAC verification
// export const config = { api: { bodyParser: false } }  ← important
```

### 3.4 Paystack SDK Helper

**`src/lib/paystack.ts`**
```typescript
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
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return hash === signature
}
```

---

## Phase 4 — API Route Handlers (Backend Proxy)

All routes follow the same pattern:
1. Verify Supabase session
2. Parse + validate request body with Zod
3. Check wallet balance (pre-flight)
4. Deduct credits atomically
5. Call upstream CheckMyNINBVN API
6. If upstream fails → refund credits atomically
7. Log call to `api_calls`
8. Return response to client

### Shared Helper: `src/lib/ninbvn.ts`
```typescript
const BASE_URL = 'https://checkmyninbvn.com.ng/api'
const API_KEY = process.env.CHECKMYNINBVN_API_KEY!

export async function callNINBVNApi(
  endpoint: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    // consent: true is added here only — never read from client body directly.
    // The route handler validates consent was present in the request before calling this.
    body: JSON.stringify({ ...body, consent: true }),
  })
  return res.json()
}

export async function callNINBVNBalance() {
  const res = await fetch(`${BASE_URL}/balance`, {
    headers: { 'x-api-key': API_KEY },
  })
  return res.json()
}
```

### Route: `app/api/verify/nin/route.ts`
```typescript
// POST body: { nin: string }
// Cost: 150 credits
// Zod schema: z.object({ nin: z.string().regex(/^\d{11}$/) })
```

### Route: `app/api/verify/nin-phone/route.ts`
```typescript
// POST body: { phone: string }
// Cost: 250 credits
// Zod schema: z.object({ phone: z.string().regex(/^(070|080|081|090|091)\d{8}$/) })
```

### Route: `app/api/verify/nin-tracking/route.ts`
```typescript
// POST body: { tracking_id: string }
// Cost: 200 credits
// Zod schema: z.object({ tracking_id: z.string().min(5).max(20) })
```

### Route: `app/api/verify/nin-demography/route.ts`
```typescript
// POST body: { firstname, lastname, gender, dob }
// Cost: 250 credits
// Zod schema: full field validation, dob as YYYY-MM-DD
```

### Route: `app/api/balance/route.ts`
```typescript
// GET — returns user's wallet_balance from profiles table
// Also optionally calls upstream balance endpoint (free)
```

### Route: `app/api/orders/route.ts`
```typescript
// POST — submit NIN modification order
// Validates service_type and required fields per type
// Costs: nin_validation=6000, others=16000
```

### Route: `app/api/orders/[reference]/route.ts`
```typescript
// GET — check order status (polls upstream + updates local DB)
```

### Batch Route: `app/api/batch/[endpoint]/route.ts`
```typescript
// POST body: { items: unknown[] }
// 1. Validate all items
// 2. Calculate total cost
// 3. Pre-flight balance check for total
// 4. Create batch_job row
// 5. Return { batch_id } to client immediately
// 6. Processing happens in background (see Phase 6)
```

### Reusable Route Handler Template
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callNINBVNApi } from '@/lib/ninbvn'
import { serviceSupabase } from '@/lib/supabase/service'
import { z } from 'zod'

const COST = 150

const schema = z.object({
  nin: z.string().regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required. The subject must have explicitly agreed to this verification.' })
  }),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Deduct credits (throws if insufficient)
  const { error: deductError } = await serviceSupabase
    .rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: COST,
      p_description: 'NIN Verification',
      p_reference: `NIN_${Date.now()}_${user.id.slice(0, 8)}`,
    })
  if (deductError) {
    return NextResponse.json(
      { error: deductError.message },
      { status: deductError.message.includes('Insufficient') ? 402 : 500 }
    )
  }

  // Call upstream
  const result = await callNINBVNApi('nin-verification', parsed.data)

  if (result.status === 'error') {
    // Refund
    await serviceSupabase.rpc('credit_wallet', {
      p_user_id: user.id,
      p_amount: COST,
      p_reference: `REFUND_${Date.now()}`,
      p_description: 'Refund: NIN Verification failed',
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
        consent_timestamp: new Date().toISOString(),
      },
      response_data: result,
      cost: 0,  // refunded
      status: 'refunded',
    })
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  // Log successful call
  await serviceSupabase.from('api_calls').insert({
    user_id: user.id,
    action_type: 'nin_verification',
    label: 'NIN Verification',
    endpoint: 'nin-verification',
    request_payload: {
      nin: parsed.data.nin,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
    },
    response_data: result,
    report_id: result.reportID,
    cost: COST,
    status: 'success',
  })

  return NextResponse.json(result)
}
```

---

## Phase 5 — Core Verification UI

### Pages & Components

**`app/verify/page.tsx`** — Verification hub
- Tab bar: NIN Number | NIN Phone | NIN Tracking | NIN Demographics
- Persists active tab in URL param `?tab=`

**`components/verify/NINForm.tsx`**
- Input: NIN (11 digits, numeric keyboard on mobile)
- Consent checkbox (required, cannot submit without it)
- Shows cost badge: "₦150 per lookup"
- Submit button disabled until input valid + consent checked

**`components/verify/NINPhoneForm.tsx`**
- Input: Phone number (Nigerian format validation)
- Consent checkbox
- Cost: ₦250

**`components/verify/NINTrackingForm.tsx`**
- Input: Tracking ID
- Cost: ₦200

**`components/verify/DemographyForm.tsx`**
- Inputs: First Name, Last Name, Gender (select), Date of Birth (date picker)
- Consent checkbox
- Cost: ₦250

**`components/verify/ResultCard.tsx`**
- Displays photo (circular avatar from base64)
- Full name, NIN number, DOB, gender
- Address section (state, LGA, town, full address)
- Birth info (country, state, LGA)
- Contact (phone, email if present)
- Report ID badge (monospace)
- Action row:
  - **"Download PDF"** — exports this single result as a formatted PDF (calls `src/lib/pdfExport.ts → exportSingleResultPDF()`)
  - **"Verify Another"** — resets the form
- ℹ️ Small note: "This result is saved to your History" — because `api_calls` was already written server-side on success; no extra action needed from the user

**`components/verify/ConsentCheckbox.tsx`**
- Never pre-checked (`defaultChecked={false}`, always explicit)
- Label text: *"I confirm the individual whose information I am submitting has explicitly consented to this verification"*
- `onChange` sets local boolean state; parent form passes it as `consent: true` in request body only when checked
- Submit button remains disabled until both input is valid AND this is checked
- Resets to unchecked on every new form render (not persisted in state between lookups)

### Wallet Guard Component
```typescript
// Shown inline above every form if balance < minimum cost
// "Your balance (₦X) is too low for this action. Fund your wallet →"
```

### Credit Info Tooltip
On every page showing wallet balance:
```
ℹ️ "Your balance (₦1,200) — each verification deducts the equivalent 
    naira amount as credits (₦1 = 1 credit). Refunds are automatic 
    if a lookup fails."
```

---

## Phase 6 — Batch Processing UI & Engine

### UI: `app/batch/page.tsx`
- Same tab structure as verify, plus "Batch Mode" toggle on each tab
- When Batch Mode is on, form swaps to bulk input

**`components/batch/BatchInput.tsx`**
- Two input modes:
  1. **Paste list** — textarea, one item per line
  2. **Upload CSV** — drag-and-drop CSV upload, auto-parses columns
- Preview table: shows first 5 rows, total count, total cost (count × unit cost)
- "Insufficient balance" warning if total cost > balance
- Consent checkbox — label dynamically shows item count: *"I confirm all {N} individuals listed have explicitly consented to this verification"* — never pre-checked, resets between submissions
- Submit → creates batch job, returns `batch_id`

**`components/batch/BatchProgress.tsx`**
- Connects to Supabase Realtime on `batch_jobs` row for live updates
- Progress bar: `completed / total`
- Item-level status list (virtual scroll for large batches)
- "Download partial results" available at any point (CSV)
- When complete, two export buttons:
  - **"Download CSV"** — flat spreadsheet of all results
  - **"Download PDF Report"** — formatted multi-page PDF with one result card per item, cover page showing batch summary (total items, cost, success/fail counts, date)
- Each individual item row has a **"↓ PDF"** icon to export just that one result
- Batch is auto-saved: each successful item logged as a row in `api_calls` with `batch_id` linking them; the batch itself also appears as a single entry in History under its `batch_jobs` record

### Batch Engine: `app/api/batch/[endpoint]/route.ts`

```typescript
// On POST:
// 1. Validate all items (return error list if any invalid)
// 2. total_cost = items.length × UNIT_COST
// 3. Check balance >= total_cost
// 4. Deduct total_cost upfront (single deduction)
// 5. Insert batch_job row (status: 'queued')
// 6. Return { batch_id } — don't wait for processing

// Processing happens in a Next.js Route Handler with no response timeout
// (or via Vercel Cron / background job pattern):
async function processBatch(batchId: string, items: unknown[], endpoint: string, userId: string) {
  await updateBatchStatus(batchId, 'running')
  const results = []

  for (const item of items) {
    await sleep(300)  // 300ms between requests to avoid upstream rate limits
    const result = await callNINBVNApi(endpoint, item)
    results.push({ item, result, status: result.status })

    if (result.status === 'error') {
      // Refund cost for this item
      await refundSingleItem(userId, UNIT_COST, batchId)
      await incrementFailed(batchId)
    } else {
      await logApiCall(userId, endpoint, item, result, batchId)
      await incrementCompleted(batchId)
    }
  }

  // Save results CSV to Supabase Storage
  const csvUrl = await saveResultsToStorage(userId, batchId, results)
  await updateBatchJob(batchId, { status: 'completed', result_url: csvUrl })
}
```

### CSV Format (Download)
Headers dynamically generated per endpoint. Example for NIN Verification:
```
nin,firstname,middlename,surname,dob,gender,phone,state,lga,address,report_id,status,error
```

---

## Phase 7 — NIN Modification Orders

### UI: `app/orders/page.tsx`
- Tab: Submit Order | My Orders

**`app/orders/submit/page.tsx`**
- Service type selector (4 types, shown with descriptions and prices)
- Dynamic form fields based on selected service_type:
  - `nin_validation`: NIN digits + Date of Birth (cheapest, ₦6,000)
  - `nin_name_modification`: NIN + current name + new name + phone (₦16,000)
  - `nin_phone_modification`: NIN + name + new phone (₦16,000)
  - `nin_address_modification`: NIN + name + phone + new address (₦16,000)
- Large warning card: "Your wallet will be charged immediately. Processing takes 24–48 hours. Rejected orders are automatically refunded."
- Consent checkbox (required)
- Confirm button opens modal with order summary before final submission

**`app/orders/list/page.tsx`**
- Table/card list of all user's modification orders
- Columns: Reference ID, Service, Amount, Status badge, Submitted date
- Click to expand: full details + "Refresh Status" button (calls upstream status endpoint)
- Status badge colors: pending=amber, processing=blue, approved=green, completed=emerald, rejected=red
- **"Export as PDF"** button per row — exports that single order as a PDF receipt
- **"Export All (PDF)"** button at top — exports all orders as a multi-page PDF
- Orders also appear in the unified History page under `action_type = 'nin_modification_order'`

**`components/orders/OrderStatusBadge.tsx`**
- Animated pulse for pending/processing states

---

## Phase 8 — Dashboard, History & Export

### What Gets Logged to History

Every meaningful user action is recorded in `api_calls`. The table below defines what qualifies, what `action_type` it uses, and what the PDF export contains:

| Action | `action_type` | Auto-logged? | PDF export content |
|---|---|---|---|
| NIN Verification (single) | `nin_verification` | ✅ Yes — on every API call | Full result card: photo, name, NIN, DOB, address, report ID |
| NIN Phone Search (single) | `nin_phone_search` | ✅ Yes | Full result card |
| NIN Tracking (single) | `nin_tracking` | ✅ Yes | Full result card |
| NIN Demography Search (single) | `nin_demography` | ✅ Yes | Full result card |
| Batch job — each item | `batch_item` | ✅ Yes — per item, linked via `batch_id` | Individual result card |
| NIN Modification Order submission | `nin_modification_order` | ✅ Yes | Order receipt: reference ID, service type, amount, status, submission timestamp |
| Wallet top-up (Paystack) | N/A — in `transactions` table | ✅ Yes | Transaction receipt: amount credited, Paystack reference, timestamp |
| Account Balance check | ❌ Not logged | — | — |
| Order Status check | ❌ Not logged | — | — |

> Failed calls (upstream error) are also logged with `status = 'refunded'` and `cost = 0`. They appear in history with a red "Failed · Refunded" badge.

---

### `app/dashboard/page.tsx`
- Wallet balance card (large ₦ display, with "Fund Wallet" CTA)
- Credit info tooltip (see above)
- Quick stats: calls today, calls this month, total spent
- Recent activity feed (last 5 entries from `api_calls`, all `action_type` values)
- Quick-action buttons: Verify NIN, Batch Lookup, Check Orders

### Wallet Balance Card
```
┌─────────────────────────────────┐
│  Wallet Balance                 │
│  ₦ 1,250.00                     │
│  [Fund Wallet]  [View History]  │
│                                 │
│  ℹ️ 1 Naira = 1 Credit. Spent   │
│     this month: ₦3,450          │
└─────────────────────────────────┘
```

---

### `app/wallet/page.tsx`
- Balance display
- Fund Wallet form (amount input, Paystack button)
- Transaction history table:
  - Type (credit/debit/refund) with colored icon
  - Description
  - Amount (+ or -)
  - Running balance after
  - Date
- **"Export Wallet History (PDF)"** button — generates a statement PDF (see PDF spec below)

---

### `app/history/page.tsx` — Unified History

This page shows a unified, filterable log of all actions from `api_calls` plus wallet credits from `transactions`.

**Filters (collapsible filter bar on mobile):**
- Action type: All | NIN Verification | NIN Phone | NIN Tracking | Demographics | Batch | Modification Orders
- Status: All | Success | Failed/Refunded
- Date range: preset chips (Today, Last 7 days, Last 30 days) + custom date picker
- Search: by Report ID, NIN, phone number (searches `request_payload` JSONB)

**List view (default on mobile):**
Each row is a card showing:
- Left: action type icon + color-coded dot (green=success, red=failed, amber=refunded)
- Center: label (e.g. "NIN Verification"), identifier (e.g. "NIN: 123456789**"), date/time
- Right: cost badge (e.g. "−₦150"), chevron to expand
- Expanded: full result card inline (same as `ResultCard.tsx`) with "Download PDF" button

**Bulk export controls (sticky bar at top):**
```
[ ] Select All    3 selected    [Export Selected (PDF)]  [Export All (PDF)]  [Export All (CSV)]
```

- Checkbox per row for multi-select
- "Select All" selects all rows matching current filter (not just visible page)
- **Export Selected (PDF)** — generates PDF containing only checked rows
- **Export All (PDF)** — generates PDF for everything matching current filter
- **Export All (CSV)** — flat CSV download of all filtered rows

**Pagination:** 20 rows per page, with "Load more" on mobile

---

### PDF Export Specification

**Library:** `jsPDF` + `jsPDF-AutoTable` (client-side, no server needed for single exports). For large exports (>50 pages), generate server-side via `app/api/history/export/route.ts` and return a download URL.

**`src/lib/pdfExport.ts`** — all export functions live here:

```typescript
// Single verification result → one-page PDF
export function exportSingleResultPDF(record: ApiCallRecord): void

// Multiple results → multi-page PDF with cover page
export function exportMultiResultPDF(records: ApiCallRecord[], title: string): void

// Wallet statement → transaction list PDF
export function exportWalletStatementPDF(
  transactions: Transaction[],
  balance: number,
  dateRange: { from: Date; to: Date }
): void

// Modification order receipt → one-page PDF
export function exportOrderReceiptPDF(order: ModificationOrder): void

// Batch report → cover page + one result per page
export function exportBatchReportPDF(batchJob: BatchJob, items: ApiCallRecord[]): void
```

**Single Result PDF layout:**
```
┌────────────────────────────────────────┐
│  zero2v                    [logo]    │
│  Verification Report                   │
│  Generated: 13 Jun 2026, 14:32         │
│  Report ID: NIN_251021154942_59E172    │
├────────────────────────────────────────┤
│  [Photo]  JOHN OLUMIDE ADEBAYO        │
│           NIN: 12345678901             │
│           DOB: 15 May 1990  Gender: M  │
├────────────────────────────────────────┤
│  CONTACT                               │
│  Phone: 08012345678                    │
├────────────────────────────────────────┤
│  RESIDENCE                             │
│  15 Allen Avenue, Ikeja, Lagos         │
│  State: Lagos  LGA: Ikeja             │
├────────────────────────────────────────┤
│  BIRTH INFORMATION                     │
│  Country: Nigeria  State: Ogun         │
│  LGA: Abeokuta North                   │
├────────────────────────────────────────┤
│  Cost: ₦150  Status: ✅ Verified       │
│  Consent recorded: 13 Jun 2026, 14:31  │
└────────────────────────────────────────┘
```

**Multi-result PDF layout:**
- Page 1: Cover — "Verification History Export", date range, total records, total cost, user name
- Pages 2+: One result card per page (same layout as single result above)
- Failed records included with "❌ Failed — Refunded" in place of data fields

**Wallet Statement PDF layout:**
- Page 1: Header — "Wallet Statement", period, opening/closing balance
- Table: Date | Description | Type | Amount | Balance After
- Footer: Total credited, total debited, net

**Modification Order Receipt PDF layout:**
- Reference ID (large, monospace)
- Service type and description
- Amount charged
- Current status + last updated
- Submission timestamp
- Warning note if pending/processing

**Server-side export route** (`app/api/history/export/route.ts`):
```typescript
// POST body: { record_ids: string[], format: 'pdf' | 'csv', title?: string }
// - Validates session
// - Fetches records from api_calls where id IN record_ids AND user_id = auth user
// - Generates PDF server-side using pdfkit (for large exports)
// - Streams file back as application/pdf with Content-Disposition: attachment
// - For CSV: streams text/csv directly
// Used when: bulk export of >50 records (client-side jsPDF struggles with memory)
```

**When to use client-side vs server-side:**
| Scenario | Method |
|---|---|
| Single result PDF | Client-side (`jsPDF`) |
| Up to ~50 records | Client-side (`jsPDF`) |
| 50+ records | Server-side (`pdfkit` via API route) |
| CSV (any size) | Client-side (`papaparse` stringify) |

---

## Phase 9 — Security Hardening

### 9.1 Environment Variable Audit
- [ ] `CHECKMYNINBVN_API_KEY` — server only, never in `NEXT_PUBLIC_`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — server only, never in `NEXT_PUBLIC_`
- [ ] `PAYSTACK_SECRET_KEY` — server only
- [ ] `PAYSTACK_WEBHOOK_SECRET` — server only
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — safe, public
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe (RLS enforces data access)
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — safe, public

### 9.2 ESLint Rules
```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["**/lib/supabase/service*", "**/lib/ninbvn*", "**/lib/paystack*", "**/lib/auditLog*"],
        "message": "Server-only module. Import only in app/api/ routes."
      }]
    }]
  }
}
```

### 9.3 Content Security Policy
```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",  // data: needed for base64 photos
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src https://checkout.paystack.com",
    ].join('; ')
  }
]
```

### 9.4 Rate Limiting Implementation
```typescript
// src/lib/rateLimit.ts
// Uses Supabase to store sliding window counters
// Key: `rate:${userId}:${endpoint}`
// Window: 60 seconds
// Max: configurable per endpoint
```

### 9.5 Input Sanitization
- All string inputs `.trim()` before validation
- NIN inputs stripped of spaces and dashes
- Phone numbers normalized to `0XXXXXXXXXX` format
- Names uppercased (NIMC stores in uppercase)
- DOMPurify not needed (no user-generated HTML rendered)

### 9.6 Supabase Service Role Usage Policy
- `serviceSupabase` (service role) is ONLY used in:
  - Paystack webhook handler
  - `deduct_credits` and `credit_wallet` RPC calls
  - Batch job processor
- All other DB access uses the user-scoped Supabase client with RLS

---

## Phase 10 — Testing & QA

### Unit Tests (Jest + Testing Library)
- [ ] Zod schema validation for each endpoint
- [ ] `consent: false` or missing consent rejected with 400 on every route
- [ ] `consent: true` with valid payload passes validation
- [ ] `ConsentCheckbox` is unchecked by default and resets between renders
- [ ] Submit button stays disabled when consent unchecked even with valid input
- [ ] `verifyWebhookSignature` function
- [ ] `auditLog()` does not throw when Supabase insert fails (silent fail)
- [ ] `auditLog()` never logs full NIN — only suffix (unit test the metadata builder)
- [ ] `auditLog()` never logs full phone number — only suffix
- [ ] Credit deduction math
- [ ] Credit deduction math
- [ ] CSV parsing utility
- [ ] Nigerian phone number validation
- [ ] NIN format validation

### Integration Tests
- [ ] Auth flow (register → email confirm → login)
- [ ] Wallet funding flow (mock Paystack)
- [ ] Each verification endpoint (mock upstream API)
- [ ] Batch processing with 3-item batch (mock)
- [ ] Refund on upstream failure
- [ ] RLS: user A cannot access user B's data
- [ ] `api_calls` row written for every successful verification with correct `action_type` and `label`
- [ ] `api_calls` row written for failed verifications with `status = 'refunded'` and `cost = 0`
- [ ] Modification order submission writes to both `modification_orders` and `api_calls`
- [ ] History page filters: action_type filter returns only matching rows
- [ ] History page filters: date range filter returns only rows in range
- [ ] History search by Report ID returns correct row
- [ ] Single PDF export generates valid PDF file with correct record data
- [ ] Bulk PDF export (client-side, ≤50 records) generates multi-page PDF with cover page
- [ ] Bulk export >50 records routes to server-side `/api/history/export` route
- [ ] Server-side export route returns 401 for unauthenticated requests
- [ ] Server-side export route only returns records belonging to the authenticated user
- [ ] CSV export contains correct headers and row count matching filter

### E2E Tests (Playwright)
- [ ] Register → fund wallet → run NIN verification → view result
- [ ] Batch upload CSV → monitor progress → download results
- [ ] Submit modification order → check status

### Security Checklist
- [ ] Confirm `CHECKMYNINBVN_API_KEY` not in client bundle (use `next build && grep -r "CHECKMYNINBVN_API_KEY" .next/static`)
- [ ] Confirm Paystack secret not in client bundle
- [ ] Confirm service role key not in client bundle
- [ ] `audit_logs` table has zero RLS policies (verified via Supabase dashboard)
- [ ] `audit_logs` is not queryable by anon key — returns 0 rows or permission error
- [ ] `audit_logs` is not queryable by authenticated user JWT — returns 0 rows
- [ ] Every successful verification writes a corresponding `audit_logs` row with correct event type
- [ ] Every failed verification writes a `warning` severity audit row
- [ ] Rate limit hit writes an audit row with `rate_limit_hit` event
- [ ] Missing consent writes `consent_missing_attempt` audit row before 400 is returned
- [ ] Invalid Paystack webhook signature writes `critical` severity audit row
- [ ] Duplicate webhook reference writes `duplicate_webhook_reference` audit row
- [ ] Audit log metadata never contains full NIN or full phone number
- [ ] `auditLog()` is called in every `/api/verify/*` route handler (code review check)
- [ ] `auditLog()` is called in Paystack webhook handler for both valid and invalid signatures
- [ ] `auditLog()` failure does not affect the main API response (silent catch confirmed)
- [ ] Test POST to `/api/verify/nin` with `consent` field omitted → 400
- [ ] Confirm `consent_timestamp` present in `api_calls.request_payload` after successful call
- [ ] Confirm consent checkbox is unchecked on fresh page load and after result is shown
- [ ] Test request with 0 balance → 402 Payment Required
- [ ] Test duplicate Paystack webhook reference → idempotent (no double credit)
- [ ] Test malformed Paystack signature → 401

---

## Environment Variables Reference

```bash
# .env.local

# Supabase (public — safe for client)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...

# Supabase (server only — never expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

# CheckMyNINBVN (server only — never expose)
CHECKMYNINBVN_API_KEY=your_api_key_here

# Paystack (public key is safe for client, secret keys are server only)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## File & Folder Structure

```
ninbvn-app/
├── .env.local
├── next.config.ts
├── middleware.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── callback/route.ts
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── verify/
│   │   │   └── page.tsx
│   │   ├── batch/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [reference]/page.tsx
│   │   ├── wallet/
│   │   │   ├── page.tsx
│   │   │   └── callback/page.tsx
│   │   ├── history/
│   │   │   └── page.tsx                    # Unified filterable history + bulk export
│   │   └── api/
│   │       ├── verify/
│   │       │   ├── nin/route.ts
│   │       │   ├── nin-phone/route.ts
│   │       │   ├── nin-tracking/route.ts
│   │       │   └── nin-demography/route.ts
│   │       ├── batch/
│   │       │   └── [endpoint]/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts
│   │       │   └── [reference]/route.ts
│   │       ├── balance/
│   │       │   └── route.ts
│   │       ├── history/
│   │       │   ├── route.ts                # GET paginated history with filters
│   │       │   └── export/route.ts         # POST server-side PDF/CSV for large exports
│   │       └── webhooks/
│   │           └── paystack/route.ts
│   ├── components/
│   │   ├── ui/                             # Shared UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Spinner.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── verify/
│   │   │   ├── NINForm.tsx
│   │   │   ├── NINPhoneForm.tsx
│   │   │   ├── NINTrackingForm.tsx
│   │   │   ├── DemographyForm.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── ConsentCheckbox.tsx
│   │   ├── batch/
│   │   │   ├── BatchInput.tsx
│   │   │   ├── BatchPreview.tsx
│   │   │   └── BatchProgress.tsx
│   │   ├── orders/
│   │   │   ├── OrderForm.tsx
│   │   │   ├── OrderList.tsx
│   │   │   └── OrderStatusBadge.tsx
│   │   ├── wallet/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── FundWalletForm.tsx
│   │   │   └── TransactionTable.tsx
│   │   ├── history/
│   │   │   ├── HistoryList.tsx             # Virtualized list of api_calls rows
│   │   │   ├── HistoryFilters.tsx          # Action type, status, date range, search
│   │   │   ├── HistoryRow.tsx              # Expandable row with inline ResultCard
│   │   │   ├── BulkExportBar.tsx           # Select-all + export buttons
│   │   │   └── ExportButton.tsx            # Reusable single-item PDF export button
│   │   └── dashboard/
│   │       ├── StatsCards.tsx
│   │       └── RecentActivity.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # Browser client
│   │   │   ├── server.ts                   # Server client (SSR)
│   │   │   └── service.ts                  # Service role (webhooks/admin only)
│   │   ├── ninbvn.ts                       # CheckMyNINBVN API helper
│   │   ├── paystack.ts                     # Paystack API + webhook verify
│   │   ├── pdfExport.ts                    # All PDF generation functions (jsPDF)
│   │   ├── auditLog.ts                     # Audit logger — server-only, never imported in app/
│   │   ├── rateLimit.ts                    # Sliding window rate limiter
│   │   └── utils.ts                        # formatNaira, sleep, generateRef, etc.
│   ├── hooks/
│   │   ├── useBalance.ts
│   │   ├── useBatchJob.ts                  # Supabase Realtime subscription
│   │   ├── useApiHistory.ts                # Paginated + filtered history query
│   │   └── useHistoryExport.ts             # Handles client vs server export routing
│   ├── types/
│   │   ├── database.ts                     # Supabase generated types
│   │   └── api.ts                          # Shared request/response types
│   └── constants/
│       └── endpoints.ts                    # Endpoint names, costs, labels, action_type map
```

---

## Stitch UI Prototype Prompt

Use the following prompt in Stitch (or any AI UI prototyping tool) to generate the mobile-first visual prototype:

---

### STITCH PROMPT

```
Design a mobile-first web app called "zero2v" — a Nigerian identity
verification platform. The visual identity is: deep forest green (#0D4C2E)
as primary, warm gold (#D4A017) as accent, off-white (#F7F5F0) as background,
and dark charcoal (#1A1A1A) for text. Use Inter or a clean humanist sans-serif
for body text, and a monospace font (e.g. JetBrains Mono) exclusively for NIN,
BVN, phone numbers, Report IDs, and reference codes. All screens are mobile
viewport (390×844px). Navigation: persistent bottom bar with 5 icons —
Home | Verify | Batch | Orders | History — active icon in forest green,
inactive in gray.

Design the following 12 screens:

---

SCREEN 1: Register Page
- Top: "zero2v" wordmark centered, forest green, bold
- Subtitle: "Create your account"
- Fields (rounded, full-width):
  Full Name | Email | Password | Confirm Password
- "Create Account" button, forest green, full-width
- Below button: small text "By registering you agree to our Terms of Service,
  including your responsibility to obtain consent before any identity lookup."
- Divider: "Already have an account?"
- "Sign In" ghost button
- Nigerian flag favicon/watermark subtly in top-right corner background

---

SCREEN 2: Login Page
- "zero2v" wordmark centered, forest green, bold
- Tagline: "Instant NIN Verification"
- Email + Password fields, rounded inputs
- "Sign In" button, forest green, full-width
- "Forgot password?" link below button, centered
- Divider: "Don't have an account?"
- "Create Account" ghost button
- Nigerian flag subtle watermark in background

---

SCREEN 3: Dashboard (Home)
- Top bar: "zero2v" logo left, user avatar/initials circle right (tapping opens profile menu)
- Wallet Balance card (forest green background, white text):
  - "Available Balance" label small
  - "₦1,250" large gold number
  - Row: [Fund Wallet] button (white bg, green text) + ℹ️ icon (tapping shows tooltip:
    "Every ₦1 you fund equals 1 credit. Verifications cost credits — e.g. NIN lookup
    costs ₦150. Failed lookups are automatically refunded.")
- Quick stats row — 3 small white cards:
  "Today · 5 calls" | "This Month · 23 calls" | "Spent · ₦3,450"
- "Quick Actions" — 2×2 grid of icon cards (white bg, green icon):
  [🔍 NIN Verify] [📱 NIN Phone]
  [📦 Batch Lookup] [📋 Orders]
- "Recent Activity" section header with "View All →" link (goes to History)
- 3 activity rows, each showing:
  - Left: colored action icon circle (green for NIN verify, blue for NIN phone/tracking, purple for batch, amber for orders)
  - Center: action label ("NIN Verification") + identifier ("NIN: 1234567****") in monospace
  - Right: "−₦150" amount + time ago ("2h ago") + green dot (success) or red dot (failed)

---

SCREEN 4: Verification Page — NIN Number tab active
- Page header: "Verify Identity" with wallet balance chip top-right ("₦1,250 ●")
- Scrollable tab bar (no underline, pill-style active state):
  [NIN Number] [NIN Phone] [NIN Tracking] [Demographics]
- Form card (white, shadow, 12px radius):
  - Section label: "NIN NUMBER LOOKUP" in small forest green caps
  - "NIN Number" field label
  - Large input, numeric keyboard hint, placeholder "Enter 11-digit NIN",
    monospace font, character counter "0/11" updates as user types
  - Cost pill: "₦150 per lookup" — gold background, dark text, right-aligned
  - Divider
  - Consent checkbox (UNCHECKED by default, green checkbox when ticked):
    "☐ I confirm the individual whose information I am submitting has explicitly
    consented to this verification."
    Note below in gray small text: "Required. Never pre-filled."
  - "Verify NIN" button — forest green, full-width, DISABLED (grayed out) until
    both the NIN is 11 digits AND the consent checkbox is ticked
- Low-balance warning bar (amber bg, below the card, only shown if balance < ₦150):
  "⚠ Insufficient balance (₦80). Fund your wallet to continue. → Fund Now"

---

SCREEN 5: Verification Result
- Back arrow top-left ("← New Lookup")
- Circular avatar (base64 photo rendered, forest green placeholder if no photo)
- Full Name in large bold: "JOHN OLUMIDE ADEBAYO"
- NIN chip (monospace, forest green bg, white text): "12345678901"
- Report ID in small monospace gray: "NIN_251021154942_59E172"
- Forest green vertical left-border accent stripe on the card (Nigerian flag nod)
- Info grid (2 columns, labeled):
  DOB: 15 May 1990  |  Gender: Male
  Phone: 08012345678  |  State: Lagos
  LGA: Ikeja  |  Town: Ikeja
- "RESIDENCE" section: "15 Allen Avenue, Ikeja, Lagos"
- "BIRTH INFO" section: Country: Nigeria · State: Ogun · LGA: Abeokuta North
- Cost & status row: "₦150 deducted · ✅ Verified"
- Consent timestamp small gray: "Consent recorded: 13 Jun 2026, 14:31"
- Small italic note: "📁 Saved to your History automatically"
- Action row (full-width, stacked on mobile):
  [⬇ Download PDF]  — gold button, full width
  [🔍 Verify Another] — ghost button, forest green border

---

SCREEN 6: Batch Lookup — Input
- Header: "Batch Lookup"
- Endpoint selector (dropdown card):
  "NIN Verification — ₦150 per item ▾"
  Other options in dropdown: NIN Phone Search (₦250) | NIN Tracking (₦200) |
  NIN Demographics (₦250)
- Input mode toggle tabs: [Paste List] [Upload CSV]
- Paste List tab active:
  - Textarea (tall, monospace font), placeholder:
    "Paste one NIN per line e.g.
     12345678901
     98765432100
     ..."
  - Below textarea: live count chip — "12 NINs detected"
- Preview strip (appears after input): "Total cost: ₦1,800 · Your balance: ₦5,000 ✅"
  (amber + ❌ if balance insufficient)
- Consent checkbox (UNCHECKED by default):
  "☐ I confirm all 12 individuals listed have explicitly consented to this verification."
  (number updates dynamically as items are detected)
- "Start Batch" button — forest green, full-width, disabled until consent checked
  and balance sufficient

---

SCREEN 7: Batch Progress
- Header: "Batch Running" with pulsing green dot
- Endpoint label: "NIN Verification · 12 items"
- Progress bar: gold fill on green track, "8 of 12 complete" label
- Stats row: ✅ 7 Verified | ❌ 1 Failed | ⏳ 4 Pending
- Scrollable item list (each row):
  - Left: status icon (✅ / ❌ / ⏳) + NIN in monospace
  - Center: name if success ("JOHN ADEBAYO") or error if failed ("Not found")
  - Right: small "↓ PDF" icon button (only shown on ✅ rows)
- Helper text: "Running in background — safe to leave this page"
- Export buttons row (shown at all times):
  [⬇ Download Partial CSV] (ghost, gold border, always active)
- Completion state (when all done) — two buttons replace partial button:
  [⬇ Download CSV]  [⬇ Download PDF Report]  (both full-width, stacked)

---

SCREEN 8: NIN Modification — Submit Order
- Header: "NIN Modification" with "My Orders →" link top-right
- Sub-header: "Service Type"
- Service type radio cards (each full-width, selectable):
  ○ NIN Validation · ₦6,000 · "Validate NIN digits and date of birth"
  ● Name Modification · ₦16,000 · "Update your name on NIMC record" (selected state: green border + filled dot)
  ○ Phone Modification · ₦16,000 · "Update your phone number on NIMC record"
  ○ Address Modification · ₦16,000 · "Update your address on NIMC record"
- Dynamic form fields (shown for Name Modification):
  NIN | Current Surname | Current First Name | Middle Name (optional)
  Phone Number | New Surname | New First Name | New Middle Name (optional)
- Warning card (amber bg, left border red):
  "⚠ Your wallet will be charged ₦16,000 immediately upon submission.
   Processing takes 24–48 hours. Rejected orders are refunded automatically."
- Consent checkbox (UNCHECKED by default):
  "☐ I confirm I am authorized to submit this modification request."
- "Review & Submit" button — forest green, full-width
  (tapping opens a confirmation modal showing all fields before final submit)

---

SCREEN 9: NIN Modification — My Orders List
- Header: "My Orders"
- "Submit New Order →" link top-right
- "Export All (PDF)" ghost button below header, right-aligned
- Order cards list (each card):
  - Top row: reference ID in monospace small + status badge right-aligned
    Status badge colors: pending=amber, processing=blue, approved=green,
    completed=emerald, rejected=red (with "Refunded" sub-label)
  - Second row: service name ("NIN Name Modification") + amount ("₦16,000")
  - Third row: submitted date + "Refresh Status" link
  - Bottom row (only on expanded card):
    All submitted field values
    "⬇ Download Receipt (PDF)" button — gold, full-width
- Empty state: "No orders yet. Submit your first NIN modification → " CTA

---

SCREEN 10: Wallet Page
- Header: "My Wallet"
- "Export Statement (PDF)" ghost button top-right, small
- Balance hero card (forest green bg):
  - "Available Balance" label
  - "₦1,250" large gold number
  - ℹ️ tooltip icon: "₦1 = 1 Credit. Verifications deduct credits equal to their
    naira cost. Failed lookups are refunded automatically."
- "Fund Wallet" section:
  - Amount input with "₦" prefix, numeric keyboard
  - Quick-amount chips: [₦500] [₦1,000] [₦2,000] [₦5,000]
  - "Pay with Paystack" button — forest green, Paystack logo left, full-width
- "Transaction History" section header
- Transaction rows (card style):
  - ↑ green: "+₦2,000 · Wallet top-up via Paystack · 2h ago · Balance after: ₦3,250"
  - ↓ red: "−₦150 · NIN Verification · 3h ago · Balance after: ₦3,100"
  - ↓ red: "−₦250 · NIN Phone Search · Yesterday · Balance after: ₦2,850"
  - ↑ blue: "+₦150 · Refund: NIN Verification failed · 2 days ago"

---

SCREEN 11: History Page
- Header: "History"
- Top row: search bar ("Search by NIN, phone, report ID...") + filter icon button
- Bulk action bar (visible when ≥1 row selected, slides in from top):
  [☑ 3 selected]  [Export PDF]  [Export CSV]  [✕ Clear]
- Filter chips row (horizontally scrollable, pill style):
  [All] [NIN Verify] [NIN Phone] [Tracking] [Demographics] [Batch] [Orders]
  Active chip: forest green bg + white text. Inactive: white bg + gray text.
- History list — each row is a card:
  - Far left: checkbox (appears on tap-and-hold or when bulk bar is active)
  - Left: colored icon circle — green for NIN verify, blue for NIN phone/tracking, amber for orders, purple for batch
  - Status dot (top-right of icon circle): filled green (success) or red (failed/refunded)
  - Center top: action label bold ("NIN Verification")
  - Center mid: identifier in monospace gray ("NIN: 1234567****")
  - Center bottom: date-time small gray ("13 Jun 2026 · 14:32")
  - Right: cost in red ("−₦150") + small "↓" PDF icon button below it
- One expanded row (show this state for one card in the design):
  Expands inline to show full result card:
  - Circular avatar, full name, NIN monospace chip, info grid (DOB, gender, phone, state)
  - Address line
  - "⬇ Download PDF" button (gold, full-width inside expanded card)
  - "✕ Collapse" small link
- Failed/refunded row style: red dot, cost shows "−₦0 (Refunded)" in muted text,
  no PDF button (no data to export), shows error message inline
- Pagination: "Load 20 more" muted button at bottom
- Empty state: simple illustration + "No activity yet. Run your first verification →"

---

SCREEN 12: Low Balance / Wallet Gate State
- This is an inline state within the Verify page (Screen 4), shown as an
  interstitial when the user has ₦0 balance and tries to access any verify tab
- Replace the form card content with:
  - 💳 icon centered
  - "Insufficient Balance" heading
  - "Your wallet is empty. Fund it to start verifying identities."
  - Balance display: "Current balance: ₦0"
  - "Fund Wallet" button — gold, full-width
  - "View pricing" link below (shows a bottom sheet with all endpoint costs:
    NIN Verification ₦150 | NIN Phone ₦250 | NIN Tracking ₦200 |
    NIN Demographics ₦250)
- Bottom navigation still visible and functional

---

GLOBAL DESIGN SYSTEM:

Typography:
- Display/headings: Inter Bold or similar humanist sans
- Body: Inter Regular
- Identifiers (NIN, phone, Report IDs, reference codes): JetBrains Mono or similar monospace
- Cost figures (₦150, −₦250): Inter SemiBold, always with ₦ prefix

Colors:
- Primary: #0D4C2E (forest green) — buttons, active states, headers
- Accent: #D4A017 (warm gold) — cost badges, PDF buttons, progress fills
- Background: #F7F5F0 (off-white) — page backgrounds
- Surface: #FFFFFF — cards, inputs
- Text: #1A1A1A (charcoal) — body
- Success: #059669 (emerald)
- Warning: #D97706 (amber)
- Error: #DC2626 (red)
- Info: #2563EB (blue) — processing states, refunds

Components:
- Cards: white bg, 12px radius, box-shadow: 0 1px 4px rgba(0,0,0,0.08)
- Buttons: 10px radius, 48px min height (touch target)
- Inputs: 10px radius, 1px #D1D5DB border, focus border #0D4C2E
- Tabs: pill-style active (green bg, white text), inactive (transparent, gray text)
- Badges: 6px radius, semibold, 12px font
- Bottom nav: white bg, 1px top border #E5E7EB, 60px height, icons 24px

Consent checkboxes (ALL forms):
- Always unchecked on render — never pre-filled
- Green fill + checkmark when checked
- Label text always specific (not generic "I agree")
- Submit button stays gray/disabled until checkbox is ticked AND all fields valid

Status badge color map:
- pending → amber (#D97706 bg, white text)
- processing → blue (#2563EB bg, white text)
- approved → green (#16A34A bg, white text)
- completed → emerald (#059669 bg, white text)
- rejected → red (#DC2626 bg, white text) with "· Refunded" sub-label
- success (api_calls) → emerald dot
- failed/refunded (api_calls) → red dot + muted cost

PDF export behavior (show on any screen with a PDF button):
- Tapping "Download PDF" shows a brief loading spinner on the button ("Generating...")
- Then triggers native share sheet (iOS/Android) — user can save to Files, AirDrop,
  WhatsApp, email, etc.
- On desktop: direct file download

Navigation:
- Bottom nav always visible (except during Paystack checkout redirect)
- Active tab: icon + label in forest green
- Page transitions: slide-from-right (forward), slide-from-left (back)
- Back arrows on all sub-pages
```

---

*Plan version 1.2 — BVN removed, audit log system fully integrated.*
