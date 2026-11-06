-- Hot Knots — explicit Data API grants for every table.
-- From 2026-10-30 Supabase no longer auto-grants API access to new tables in
-- "public", including when the schema is rebuilt from migrations (new project,
-- preview branch, `supabase db reset`). Live tables already have these grants;
-- this makes a rebuild match. RLS policies still decide which rows are visible.
-- Idempotent: safe to re-run. New tables must add their own grants.

-- authenticated (you, in the app) and service_role get full access everywhere.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'events', 'menu_categories', 'menu_items', 'sales_transactions',
      'sales_line_items', 'inventory_items', 'recipe_components',
      'inventory_transactions', 'prep_forecasts', 'expenses',
      'social_posts', 'social_metrics', 'social_strategy_plan',
      'inventory_item_components', 'contacts', 'email_accounts',
      'email_messages', 'inquiries', 'inventory_counts', 'calendar_tasks',
      'newsletter_signups', 'todo_categories', 'todo_items', 'event_days'
    ])
  loop
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated, service_role',
      t
    );
  end loop;
end $$;

-- anon (the public site) only gets what its RLS policies allow.
grant select on public.menu_categories to anon;
grant select on public.menu_items to anon;
grant select on public.events to anon;
grant select on public.event_days to anon;
grant insert on public.inquiries to anon;
grant insert on public.newsletter_signups to anon;
