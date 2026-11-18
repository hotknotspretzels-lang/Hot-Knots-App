-- Hot Knots — reusable checklists for load-out, opening, closing, and prep.
-- Item quantities are written for a base customer count and can scale when
-- Adam enters an expected headcount. Checked state is stored so a list can
-- be resumed on another phone, then cleared for the next event.
--
-- Apply this file to the database BEFORE using Checklists in the app.
-- Opening the pull request or deploying the site does not apply it.
-- Idempotent: safe to re-run.

create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Headcount the item quantities were written for. Example: 100.
  base_customer_count integer not null default 100,
  -- Headcount for the current run. Null shows the base amounts.
  expected_customer_count integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint checklists_name_length check (char_length(name) between 1 and 120),
  constraint checklists_base_customer_count_positive check (base_customer_count > 0),
  constraint checklists_expected_customer_count_positive check (
    expected_customer_count is null or expected_customer_count > 0
  )
);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists (id) on delete cascade,
  title text not null,
  -- Null means a plain checkbox, such as "Bring generator".
  quantity numeric,
  unit text,
  -- False keeps the quantity fixed, such as "1 propane tank".
  -- Ignored when quantity is null.
  scales boolean not null default true,
  is_checked boolean not null default false,
  checked_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint checklist_items_title_length check (char_length(title) between 1 and 200),
  constraint checklist_items_quantity_positive check (quantity is null or quantity > 0),
  constraint checklist_items_unit_length check (unit is null or char_length(unit) between 1 and 40),
  constraint checklist_items_unit_requires_quantity check (unit is null or quantity is not null)
);

create index if not exists checklist_items_checklist_id_idx
  on checklist_items (checklist_id, sort_order);

alter table checklists enable row level security;
alter table checklist_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'checklists'
      and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on checklists
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'checklist_items'
      and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on checklist_items
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- New public tables are not auto-granted. The ops app signs in as
-- authenticated. anon gets nothing; there is no policy for it either.
revoke all on table public.checklists from anon, public;
revoke all on table public.checklist_items from anon, public;
grant select, insert, update, delete on public.checklists to authenticated, service_role;
grant select, insert, update, delete on public.checklist_items to authenticated, service_role;

comment on table checklists is
  'Named reusable lists for trailer prep and events.';
comment on column checklists.base_customer_count is
  'Customer count the item quantities are written for.';
comment on column checklists.expected_customer_count is
  'Customer count for the current run. Scalable quantities multiply by expected / base.';
comment on column checklist_items.quantity is
  'Amount needed at the checklist base customer count. Null is a plain checkbox.';
comment on column checklist_items.scales is
  'When false, quantity stays fixed instead of scaling with expected customers.';
comment on column checklist_items.is_checked is
  'Run progress. Cleared by Uncheck all so the list can be reused.';
