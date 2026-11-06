-- Hot Knots — multi-day events. Each event gets one row per day it runs,
-- with that day's own start/end time. events.event_date / event_time stay as
-- the first day and its start time; events.end_date is the last day.
-- Both the app calendar and the public site schedule read from event_days.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

alter table events add column if not exists end_date date;

create table if not exists event_days (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  day_date date not null,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  unique (event_id, day_date)
);

create index if not exists event_days_day_date_idx on event_days (day_date);

-- Backfill existing single-day events.
insert into event_days (event_id, day_date, start_time)
select id, event_date, event_time from events
on conflict (event_id, day_date) do nothing;

update events set end_date = event_date where end_date is null;

-- Any event inserted without explicit days (e.g. by an older app build)
-- still gets its first day, so it never goes missing from the calendars.
create or replace function events_default_end_date() returns trigger
language plpgsql as $$
begin
  new.end_date := coalesce(new.end_date, new.event_date);
  return new;
end $$;

create or replace function events_default_first_day() returns trigger
language plpgsql as $$
begin
  insert into event_days (event_id, day_date, start_time)
  values (new.id, new.event_date, new.event_time)
  on conflict (event_id, day_date) do nothing;
  return new;
end $$;

drop trigger if exists events_default_end_date on events;
create trigger events_default_end_date
  before insert on events
  for each row execute function events_default_end_date();

drop trigger if exists events_default_first_day on events;
create trigger events_default_first_day
  after insert on events
  for each row execute function events_default_first_day();

alter table event_days enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_days' and policyname = 'authenticated_full_access'
  ) then
    create policy "authenticated_full_access" on event_days
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'event_days' and policyname = 'anon_read_public_event_days'
  ) then
    create policy "anon_read_public_event_days" on event_days
      for select to anon using (
        exists (
          select 1 from events e
          where e.id = event_days.event_id
            and e.is_public = true
            and e.status <> 'cancelled'
        )
      );
  end if;
end $$;
