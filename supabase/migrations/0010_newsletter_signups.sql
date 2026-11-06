-- Hot Knots — public website "Join the Knot-work" newsletter signup.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

create table if not exists newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_signups_email_idx
  on newsletter_signups (lower(email));

alter table newsletter_signups enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'newsletter_signups' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on newsletter_signups
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'newsletter_signups' and policyname = 'anon_insert_newsletter_signups'
  ) then
    create policy "anon_insert_newsletter_signups" on newsletter_signups
      for insert to anon with check (true);
  end if;
end $$;
