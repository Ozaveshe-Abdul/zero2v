-- 1. Create Enums
create type transaction_type as enum ('credit', 'debit', 'refund');
create type api_call_status as enum ('success', 'error', 'refunded');

create type action_type as enum (
  'nin_verification',
  'nin_phone_search',
  'nin_tracking',
  'nin_demography',
  'nin_modification_order',
  'batch_item'
);

create type batch_status as enum ('queued', 'running', 'completed', 'partial', 'failed');
create type order_status as enum ('pending', 'processing', 'approved', 'completed', 'rejected');
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
  'consent_missing_attempt',
  'invalid_nin_format_attempt',
  'suspicious_phone_query_pattern',
  'unauthorized_api_access',
  'webhook_signature_invalid',
  'duplicate_webhook_reference',

  -- Admin/system events
  'api_key_used',
  'supabase_service_role_used'
);

-- 2. Create Tables

-- Profiles Table (Extends auth.users)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text unique not null,
  phone         text,
  wallet_balance integer not null default 0,  -- stored in whole naira (1:1 credits)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Transactions Table
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

-- Batch Jobs Table
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

-- API Calls Table
create table api_calls (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  action_type     action_type not null,         -- human-readable category
  endpoint        text not null,                -- e.g. 'nin-verification'
  label           text,                         -- display label e.g. 'NIN Verification'
  request_payload jsonb,                        -- sanitized payload (no API keys, includes consent info)
  response_data   jsonb,                        -- full response cached
  report_id       text,                         -- reportID from upstream
  cost            integer not null,             -- credits deducted
  status          api_call_status default 'success',
  batch_id        uuid references batch_jobs(id), -- null if not part of a batch
  created_at      timestamptz default now()
);

-- Modification Orders Table
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

-- Paystack Events Table (Webhook idempotency logging)
create table paystack_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,
  reference       text unique not null,
  payload         jsonb not null,
  processed       boolean default false,
  created_at      timestamptz default now()
);

-- Audit Logs Table
create table audit_logs (
  id              uuid primary key default gen_random_uuid(),
  event           audit_event not null,
  severity        audit_severity not null default 'info',
  user_id         uuid references profiles(id) on delete set null,
  ip_address      inet,
  user_agent      text,
  metadata        jsonb,                        -- event-specific details
  created_at      timestamptz default now()
);

-- 3. Create Indexes for Queries

-- Indexes on api_calls
create index api_calls_user_created on api_calls(user_id, created_at desc);
create index api_calls_action_type  on api_calls(user_id, action_type);
create index api_calls_batch        on api_calls(batch_id) where batch_id is not null;

-- Indexes on audit_logs
create index audit_logs_event      on audit_logs(event, created_at desc);
create index audit_logs_user       on audit_logs(user_id, created_at desc);
create index audit_logs_severity   on audit_logs(severity, created_at desc);
create index audit_logs_ip         on audit_logs(ip_address, created_at desc);
create index audit_logs_created    on audit_logs(created_at desc);

-- 4. Enable Row Level Security (RLS)

alter table profiles enable row level security;
alter table transactions enable row level security;
alter table api_calls enable row level security;
alter table batch_jobs enable row level security;
alter table modification_orders enable row level security;
alter table paystack_events enable row level security;
alter table audit_logs enable row level security;

-- 5. Create RLS Policies

-- profiles policies
create policy "Users can read their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- transactions policies
create policy "Users can read their own transactions" on transactions
  for select using (auth.uid() = user_id);

-- api_calls policies
create policy "Users can read their own api_calls" on api_calls
  for select using (auth.uid() = user_id);

-- batch_jobs policies
create policy "Users can read their own batch_jobs" on batch_jobs
  for select using (auth.uid() = user_id);

create policy "Users can insert/update their own batch_jobs" on batch_jobs
  for all using (auth.uid() = user_id);

-- modification_orders policies
create policy "Users can read their own modification_orders" on modification_orders
  for select using (auth.uid() = user_id);

create policy "Users can insert/update their own modification_orders" on modification_orders
  for all using (auth.uid() = user_id);

-- paystack_events policies
-- No public user policies. (Accessed strictly by service role)

-- audit_logs policies
-- Strict lockout. No user-facing policies. (Only readable via service role / direct DB query)


-- 6. Stored Procedures (Atomic Wallet Actions)

-- Atomic Debit Stored Procedure
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

  if v_balance is null then
    raise exception 'User profile not found';
  end if;

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

-- Atomic Credit Stored Procedure
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

  if v_balance is null then
    raise exception 'User profile not found';
  end if;

  update profiles
    set wallet_balance = wallet_balance + p_amount,
        updated_at = now()
    where id = p_user_id;

  insert into transactions(user_id, type, amount, balance_before, balance_after, description, reference)
    values (p_user_id, 'credit', p_amount, v_balance, v_balance + p_amount, p_description, p_reference);
end;
$$;


-- 7. Auth Triggers to auto-create Profile row

-- Trigger function
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

-- Trigger definition
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
