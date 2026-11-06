-- Hot Knots — record a start time on events and let events (and calendar
-- tasks) optionally link to a contact from the contacts book.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

alter table events add column if not exists event_time time;
alter table events add column if not exists contact_id uuid references contacts (id) on delete set null;

create index if not exists events_contact_id_idx on events (contact_id);
