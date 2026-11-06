-- Hot Knots — initial schema for all 5 domains (Sales/Events, Inventory,
-- Prep Forecasting, True COGS/Expenses, Social Media).
-- Single-business app: RLS restricts every table to authenticated users only.

-- ============================================================================
-- Enums
-- ============================================================================

create type event_type as enum (
  'festival', 'private_catering', 'farmers_market', 'street_lot',
  'corporate', 'brewery_bar', 'sporting_event', 'other'
);

create type event_status as enum ('planned', 'completed', 'cancelled');

create type payment_method as enum ('cash', 'card', 'other');

create type inventory_category as enum ('food', 'packaging', 'other');

create type inventory_transaction_type as enum (
  'purchase', 'usage', 'waste', 'adjustment', 'prep_stock'
);

create type expense_category as enum (
  'fuel', 'propane', 'vehicle_maintenance', 'commissary_rent',
  'labor_wages', 'permits_fees', 'packaging_supplies', 'insurance',
  'marketing', 'other'
);

create type social_platform as enum (
  'instagram', 'facebook', 'tiktok', 'twitter_x', 'other'
);

create type social_post_type as enum ('photo', 'video', 'story', 'reel', 'other');

create type social_strategy_status as enum ('idea', 'scheduled', 'posted');

-- ============================================================================
-- Sales & Events
-- ============================================================================

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  event_type event_type not null,
  location text,
  expected_attendance integer,
  actual_attendance integer,
  weather_condition text,
  temperature_high integer,
  booth_fee numeric(10, 2),
  status event_status not null default 'planned',
  notes text,
  created_at timestamptz not null default now()
);

create index events_event_date_idx on events (event_date);
create index events_event_type_idx on events (event_type);

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references menu_categories (id) on delete set null,
  name text not null,
  sku text,
  price numeric(10, 2) not null,
  food_cost_per_unit numeric(10, 2),
  unit_of_measure text not null default 'each',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index menu_items_category_id_idx on menu_items (category_id);

create table sales_transactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  transaction_time timestamptz not null default now(),
  payment_method payment_method not null,
  subtotal numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  tip numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index sales_transactions_event_id_idx on sales_transactions (event_id);
create index sales_transactions_transaction_time_idx on sales_transactions (transaction_time);

create table sales_line_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references sales_transactions (id) on delete cascade,
  menu_item_id uuid not null references menu_items (id) on delete restrict,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null,
  is_comp boolean not null default false
);

create index sales_line_items_transaction_id_idx on sales_line_items (transaction_id);
create index sales_line_items_menu_item_id_idx on sales_line_items (menu_item_id);

-- ============================================================================
-- Inventory
-- ============================================================================

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category inventory_category not null default 'food',
  unit_of_measure text not null default 'unit',
  current_unit_cost numeric(10, 4),
  par_level numeric(10, 2),
  reorder_point numeric(10, 2),
  preferred_supplier text,
  created_at timestamptz not null default now()
);

create table recipe_components (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items (id) on delete cascade,
  inventory_item_id uuid not null references inventory_items (id) on delete cascade,
  quantity_per_unit numeric(10, 4) not null,
  unique (menu_item_id, inventory_item_id)
);

create table inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references inventory_items (id) on delete cascade,
  event_id uuid references events (id) on delete set null,
  transaction_type inventory_transaction_type not null,
  quantity numeric(10, 2) not null,
  unit_cost numeric(10, 4),
  transaction_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index inventory_transactions_inventory_item_id_idx on inventory_transactions (inventory_item_id);
create index inventory_transactions_event_id_idx on inventory_transactions (event_id);

-- ============================================================================
-- Prep Production Forecasting
-- ============================================================================

create table prep_forecasts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  menu_item_id uuid not null references menu_items (id) on delete cascade,
  suggested_prep_qty numeric(10, 2),
  basis_notes text,
  actual_prep_qty numeric(10, 2),
  actual_sold_qty numeric(10, 2),
  created_at timestamptz not null default now(),
  unique (event_id, menu_item_id)
);

-- ============================================================================
-- True COGS / Expenses
-- ============================================================================

create table expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id) on delete set null,
  category expense_category not null,
  amount numeric(10, 2) not null,
  expense_date date not null default current_date,
  mileage numeric(10, 2),
  gallons numeric(10, 3),
  notes text,
  created_at timestamptz not null default now()
);

create index expenses_event_id_idx on expenses (event_id);
create index expenses_expense_date_idx on expenses (expense_date);

-- ============================================================================
-- Social Media
-- ============================================================================

create table social_posts (
  id uuid primary key default gen_random_uuid(),
  platform social_platform not null,
  post_date date not null default current_date,
  post_type social_post_type not null default 'photo',
  caption_summary text,
  permalink text,
  linked_event_id uuid references events (id) on delete set null,
  created_at timestamptz not null default now()
);

create table social_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references social_posts (id) on delete cascade,
  recorded_date date not null default current_date,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  views integer default 0,
  reach integer default 0,
  follower_count_snapshot integer,
  created_at timestamptz not null default now()
);

create index social_metrics_post_id_idx on social_metrics (post_id);

create table social_strategy_plan (
  id uuid primary key default gen_random_uuid(),
  planned_date date not null,
  platform social_platform not null,
  content_idea text not null,
  linked_event_id uuid references events (id) on delete set null,
  status social_strategy_status not null default 'idea',
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security — single-business app, any authenticated user (you)
-- has full access; anonymous access is blocked entirely.
-- ============================================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'events', 'menu_categories', 'menu_items', 'sales_transactions',
      'sales_line_items', 'inventory_items', 'recipe_components',
      'inventory_transactions', 'prep_forecasts', 'expenses',
      'social_posts', 'social_metrics', 'social_strategy_plan'
    ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "authenticated_full_access" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
