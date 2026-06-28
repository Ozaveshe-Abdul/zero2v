-- Idempotent Debit (safe for retries — skips if reference already processed)
create or replace function safe_deduct_credits(
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

  if exists (select 1 from transactions where reference = p_reference and type = 'debit') then
    return;
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

-- Idempotent Refund (safe for retries — skips if reference already refunded)
create or replace function refund_wallet(
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

  if exists (select 1 from transactions where reference = p_reference and type = 'refund') then
    return;
  end if;

  update profiles
    set wallet_balance = wallet_balance + p_amount,
        updated_at = now()
    where id = p_user_id;

  insert into transactions(user_id, type, amount, balance_before, balance_after, description, reference)
    values (p_user_id, 'refund', p_amount, v_balance, v_balance + p_amount, p_description, p_reference);
end;
$$;

-- Idempotent Credit for Paystack webhooks (safe under duplicate delivery)
create or replace function process_paystack_credit(
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

  if exists (select 1 from transactions where reference = p_reference and type = 'credit') then
    return;
  end if;

  update profiles
    set wallet_balance = wallet_balance + p_amount,
        updated_at = now()
    where id = p_user_id;

  insert into transactions(user_id, type, amount, balance_before, balance_after, description, reference)
    values (p_user_id, 'credit', p_amount, v_balance, v_balance + p_amount, p_description, p_reference);
end;
$$;

-- Reconciliation view: find debits without a matching refund/credit within 30 minutes
create or replace view orphaned_debits as
select
  t.id              as transaction_id,
  t.user_id,
  t.amount,
  t.description,
  t.reference       as debit_reference,
  t.created_at      as debited_at,
  extract(epoch from (now() - t.created_at))::integer / 60 as age_minutes
from transactions t
where t.type = 'debit'
  and t.created_at < now() - interval '5 minutes'
  and not exists (
    select 1 from transactions t2
    where t2.user_id = t.user_id
      and t2.type in ('credit', 'refund')
      and t2.created_at > t.created_at
      and t2.created_at < t.created_at + interval '30 minutes'
  );
