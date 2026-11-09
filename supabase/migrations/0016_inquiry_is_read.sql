-- Hot Knots — let the ops app mark inquiries as read without changing
-- their pipeline status (new / contacted / booked / declined).
--
-- Apply this file to the database BEFORE using Mark read in the app.
-- It is not applied by opening the pull request or by deploying the site.
-- Existing rows stay unread (is_read = false) and keep their current status.
-- Idempotent: safe to re-run.

alter table inquiries
  add column if not exists is_read boolean not null default false;

comment on column inquiries.is_read is
  'True after an ops user marks the inquiry read. Independent of inquiry_status.';
