-- Hot Knots — some events charge a percentage of sales instead of (or on top
-- of) a flat booth fee. Stored as a percent, e.g. 15 = 15% of gross sales.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

alter table events add column if not exists booth_fee_percent numeric(5, 2);
