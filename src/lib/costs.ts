import type { Expense, InventoryTransaction } from "@/lib/types";

export function computeFoodCostByEvent(
  usageTransactions: InventoryTransaction[],
): Map<string, number> {
  const costs = new Map<string, number>();

  for (const t of usageTransactions) {
    if (t.transaction_type !== "usage" || !t.event_id) continue;
    const current = costs.get(t.event_id) ?? 0;
    costs.set(t.event_id, current + t.quantity * (t.unit_cost ?? 0));
  }

  return costs;
}

export function computeExpensesByEvent(expenses: Expense[]): Map<string, number> {
  const totals = new Map<string, number>();

  for (const e of expenses) {
    if (!e.event_id) continue;
    const current = totals.get(e.event_id) ?? 0;
    totals.set(e.event_id, current + e.amount);
  }

  return totals;
}

export function sumOverheadExpenses(expenses: Expense[], since?: string): number {
  return expenses
    .filter((e) => !e.event_id && (!since || e.expense_date >= since))
    .reduce((sum, e) => sum + e.amount, 0);
}
