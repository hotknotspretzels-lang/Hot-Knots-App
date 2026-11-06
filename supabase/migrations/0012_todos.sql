-- Hot Knots — general to-do list: user-defined categories, each holding
-- items that get checked off. Checked items are kept (is_done) but hidden
-- from the list. Internal only; never exposed to the public site.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

create table if not exists todo_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists todo_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references todo_categories (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists todo_items_category_id_idx on todo_items (category_id);

alter table todo_categories enable row level security;
alter table todo_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'todo_categories' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on todo_categories
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'todo_items' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on todo_items
      for all to authenticated using (true) with check (true);
  end if;
end $$;
