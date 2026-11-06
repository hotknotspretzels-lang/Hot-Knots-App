-- Hot Knots — physical stock counts, the observed-quantity input needed to
-- back into actual (vs theoretical) ingredient usage.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

create table if not exists inventory_counts (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items (id) on delete cascade,
  count_date date not null,
  counted_quantity numeric(10, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (inventory_item_id, count_date)
);

create index if not exists inventory_counts_item_date_idx
  on inventory_counts (inventory_item_id, count_date desc);

alter table inventory_counts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'inventory_counts' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on inventory_counts
      for all to authenticated using (true) with check (true);
  end if;
end $$;
