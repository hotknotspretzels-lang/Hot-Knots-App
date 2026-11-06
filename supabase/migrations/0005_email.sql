-- Hot Knots — connected email accounts and a local read-only message mirror.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

create table if not exists email_accounts (
  id uuid primary key default gen_random_uuid(),
  email_address text not null unique,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  connected_at timestamptz not null default now()
);

create table if not exists email_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references email_accounts (id) on delete cascade,
  gmail_message_id text not null,
  thread_id text,
  from_name text,
  from_address text,
  subject text,
  snippet text,
  body_text text,
  received_at timestamptz,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (account_id, gmail_message_id)
);

create index if not exists email_messages_account_id_idx on email_messages (account_id);
create index if not exists email_messages_received_at_idx on email_messages (received_at desc);

alter table email_accounts enable row level security;
alter table email_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'email_accounts' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on email_accounts
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'email_messages' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on email_messages
      for all to authenticated using (true) with check (true);
  end if;
end $$;
