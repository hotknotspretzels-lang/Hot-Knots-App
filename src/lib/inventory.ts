import type { InventoryTransaction, InventoryTransactionType } from "@/lib/types";

export function computeOnHand(transactions: InventoryTransaction[]): Map<string, number> {
  const onHand = new Map<string, number>();

  for (const t of transactions) {
    const current = onHand.get(t.inventory_item_id) ?? 0;
    let delta = 0;

    switch (t.transaction_type) {
      case "purchase":
      case "prep_stock":
        delta = t.quantity;
        break;
      case "usage":
      case "waste":
        delta = -t.quantity;
        break;
      case "adjustment":
        delta = t.quantity;
        break;
    }

    onHand.set(t.inventory_item_id, current + delta);
  }

  return onHand;
}

export function sumByItem(
  transactions: InventoryTransaction[],
  types: InventoryTransactionType[],
  since?: string,
): Map<string, number> {
  const sums = new Map<string, number>();

  for (const t of transactions) {
    if (!types.includes(t.transaction_type)) continue;
    if (since && t.transaction_date < since) continue;

    const current = sums.get(t.inventory_item_id) ?? 0;
    sums.set(t.inventory_item_id, current + t.quantity);
  }

  return sums;
}
