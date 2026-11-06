-- Hot Knots — internal calendar items (meetings, application deadlines,
-- reminders, etc.) that live on the app calendar alongside events but never
-- appear on the public site schedule. Optionally linked to a contact.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

create table if not exists calendar_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  due_date date not null,
  due_time time,
  contact_id uuid references contacts (id) on delete set null,
  notes text,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Bring an existing table (created by an earlier version of this migration,
-- before due_time/contact_id existed) up to date.
alter table calendar_tasks add column if not exists due_time time;
alter table calendar_tasks add column if not exists contact_id uuid references contacts (id) on delete set null;
alter table calendar_tasks drop column if exists item_type;

drop type if exists calendar_task_type;

create index if not exists calendar_tasks_due_date_idx on calendar_tasks (due_date);
create index if not exists calendar_tasks_contact_id_idx on calendar_tasks (contact_id);

alter table calendar_tasks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'calendar_tasks' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on calendar_tasks
      for all to authenticated using (true) with check (true);
  end if;
end $$;
