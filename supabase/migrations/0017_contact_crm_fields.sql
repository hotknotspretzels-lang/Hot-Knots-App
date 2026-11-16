-- Hot Knots — booking fields on contacts so title, pipeline status, and
-- follow-up dates are columns instead of notes.
--
-- Existing columns are kept as-is (including business_name and notes).
-- Every new column is nullable and has no default, so existing rows stay
-- null and nothing in notes is rewritten.
--
-- Apply this file to the database BEFORE using the updated Contacts form.
-- Opening the pull request or deploying the site does not apply it.
-- Idempotent: safe to re-run.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'contact_status'
  ) then
    create type contact_status as enum (
      'prospect',
      'contacted',
      'awaiting_reply',
      'in_conversation',
      'booked',
      'declined',
      'bounced'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'contact_method'
  ) then
    create type contact_method as enum (
      'email',
      'phone',
      'text',
      'either'
    );
  end if;
end $$;

alter table contacts add column if not exists title text;
alter table contacts add column if not exists secondary_email text;
alter table contacts add column if not exists secondary_phone text;
alter table contacts add column if not exists website text;
alter table contacts add column if not exists location text;
alter table contacts add column if not exists related_event text;
alter table contacts add column if not exists source text;
alter table contacts add column if not exists status contact_status;
alter table contacts add column if not exists last_contacted_on date;
alter table contacts add column if not exists next_follow_up_on date;
alter table contacts add column if not exists preferred_contact_method contact_method;

comment on column contacts.title is
  'Role at the organization, such as Events Director.';
comment on column contacts.secondary_email is
  'Backup email. Independent of email.';
comment on column contacts.secondary_phone is
  'Backup phone. Independent of phone.';
comment on column contacts.website is
  'Organization or personal site. A full URL or a bare domain.';
comment on column contacts.location is
  'Address or place, such as a campus office or venue.';
comment on column contacts.related_event is
  'Free-text event or opportunity, such as Sounds of Summer 2027.';
comment on column contacts.source is
  'Where this contact was found. A page URL is fine.';
comment on column contacts.status is
  'Booking pipeline. Null until someone sets it. bounced means the address or number is bad.';
comment on column contacts.last_contacted_on is
  'Calendar date of the last outreach. No time component.';
comment on column contacts.next_follow_up_on is
  'Calendar date to follow up next. No time component.';
comment on column contacts.preferred_contact_method is
  'How they prefer to be reached: email, phone, text, or either.';

create index if not exists contacts_status_idx on contacts (status);
create index if not exists contacts_next_follow_up_idx on contacts (next_follow_up_on);

-- Table privileges already cover new columns. Enum types need their own usage
-- grant so the Data API can read and write them.
grant usage on type public.contact_status to authenticated, service_role;
grant usage on type public.contact_method to authenticated, service_role;
