-- Hot Knots — add event location and start/end time to inquiries so
-- catering/booking requests capture where and when the truck is needed.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

alter table inquiries add column if not exists event_location text;
alter table inquiries add column if not exists event_start_time time;
alter table inquiries add column if not exists event_end_time time;
