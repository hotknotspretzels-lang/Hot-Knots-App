-- Hot Knots — contacts book for venues, organizers, vendors, and other
-- people/businesses you work with.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'contact_type') then
    create type contact_type as enum (
      'venue', 'event_organizer', 'vendor_supplier', 'food_truck', 'press_media', 'other'
    );
  end if;
end $$;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text,
  contact_type contact_type not null default 'other',
  email text,
  phone text,
  social_handle text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists contacts_name_idx on contacts (name);

alter table contacts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contacts'
      and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on contacts
      for all to authenticated using (true) with check (true);
  end if;
end $$;
