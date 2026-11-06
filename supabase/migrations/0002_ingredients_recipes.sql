-- Hot Knots — ingredients, recipes, and waste tracking.
-- Adds prepared/batch items (self-referential BOM) to inventory_items and
-- replaces menu_items' manual food_cost_per_unit with a fully computed cost
-- derived from recipe_components + inventory_item_components.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

alter table inventory_items
  add column if not exists is_prepared boolean not null default false,
  add column if not exists yield_quantity numeric(10, 4),
  add column if not exists yield_unit_of_measure text;

create table if not exists inventory_item_components (
  id uuid primary key default gen_random_uuid(),
  parent_item_id uuid not null references inventory_items (id) on delete cascade,
  component_item_id uuid not null references inventory_items (id) on delete cascade,
  quantity numeric(10, 4) not null,
  check (parent_item_id <> component_item_id),
  unique (parent_item_id, component_item_id)
);

create index if not exists inventory_item_components_parent_item_id_idx on inventory_item_components (parent_item_id);
create index if not exists inventory_item_components_component_item_id_idx on inventory_item_components (component_item_id);

alter table menu_items drop column if exists food_cost_per_unit;

alter table inventory_item_components enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inventory_item_components'
      and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on inventory_item_components
      for all to authenticated using (true) with check (true);
  end if;
end $$;
