-- Hot Knots — public customer-facing site support: opt-in public schedule
-- flag on events, catering/event inquiries, and narrow anon-role read/insert
-- access for the separate public website (shares this database).
-- Idempotent: safe to re-run if an earlier attempt partially applied.

alter table events add column if not exists is_public boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inquiry_type') then
    create type inquiry_type as enum ('catering', 'event_booking', 'general');
  end if;

  if not exists (select 1 from pg_type where typname = 'inquiry_status') then
    create type inquiry_status as enum ('new', 'contacted', 'booked', 'declined');
  end if;
end $$;

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type inquiry_type not null default 'general',
  name text not null,
  email text,
  phone text,
  event_date date,
  guest_count integer,
  message text,
  status inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on inquiries (created_at desc);

alter table inquiries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inquiries' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on inquiries
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inquiries' and policyname = 'anon_insert_inquiries'
  ) then
    create policy "anon_insert_inquiries" on inquiries
      for insert to anon with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'menu_items' and policyname = 'anon_read_active_menu_items'
  ) then
    create policy "anon_read_active_menu_items" on menu_items
      for select to anon using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'menu_categories' and policyname = 'anon_read_menu_categories'
  ) then
    create policy "anon_read_menu_categories" on menu_categories
      for select to anon using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'anon_read_public_events'
  ) then
    create policy "anon_read_public_events" on events
      for select to anon using (is_public = true and status <> 'cancelled');
  end if;
end $$;
