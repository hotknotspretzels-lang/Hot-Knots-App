-- Hot Knots — links inventory usage back to the sale that generated it,
-- so deleting a sale automatically cleans up the stock it depleted.
-- Idempotent: safe to re-run if an earlier attempt partially applied.

alter table inventory_transactions
  add column if not exists sales_transaction_id uuid references sales_transactions (id) on delete cascade;

create index if not exists inventory_transactions_sales_transaction_id_idx
  on inventory_transactions (sales_transaction_id);
