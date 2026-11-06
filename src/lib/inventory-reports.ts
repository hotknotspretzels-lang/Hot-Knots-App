import type { InventoryCount, InventoryItem, InventoryTransaction } from "@/lib/types";
import { computeOnHand } from "@/lib/inventory";

export interface ActualVsTheoreticalRow {
  inventoryItemId: string;
  name: string;
  unitOfMeasure: string;
  beginningOnHand: number;
  purchasesQty: number;
  endingCountQty: number | null;
  actualUsageQty: number | null;
  theoreticalUsageQty: number;
  varianceQty: number | null;
  variancePercent: number | null;
  unitCost: number;
  varianceCost: number | null;
}

// monthEndExclusive is the first day of the following month — the same
// half-open-interval convention used everywhere else quantities are summed
// over a date range in this app.
export function computeActualVsTheoretical(
  items: InventoryItem[],
  transactions: InventoryTransaction[],
  counts: InventoryCount[],
  costMap: Map<string, number>,
  monthStart: string,
  monthEndExclusive: string,
): ActualVsTheoreticalRow[] {
  const beginningOnHand = computeOnHand(
    transactions.filter((t) => t.transaction_date < monthStart),
  );

  const inMonth = transactions.filter(
    (t) => t.transaction_date >= monthStart && t.transaction_date < monthEndExclusive,
  );

  const purchasesByItem = new Map<string, number>();
  const theoreticalUsageByItem = new Map<string, number>();
  for (const t of inMonth) {
    if (t.transaction_type === "purchase") {
      purchasesByItem.set(
        t.inventory_item_id,
        (purchasesByItem.get(t.inventory_item_id) ?? 0) + t.quantity,
      );
    } else if (t.transaction_type === "usage") {
      theoreticalUsageByItem.set(
        t.inventory_item_id,
        (theoreticalUsageByItem.get(t.inventory_item_id) ?? 0) + t.quantity,
      );
    }
  }

  const countByItem = new Map<string, InventoryCount>();
  for (const c of counts) {
    if (c.count_date < monthStart || c.count_date >= monthEndExclusive) continue;
    const existing = countByItem.get(c.inventory_item_id);
    if (!existing || c.count_date >= existing.count_date) {
      countByItem.set(c.inventory_item_id, c);
    }
  }

  return items.map((item) => {
    const beginning = beginningOnHand.get(item.id) ?? 0;
    const purchasesQty = purchasesByItem.get(item.id) ?? 0;
    const theoreticalUsageQty = theoreticalUsageByItem.get(item.id) ?? 0;
    const count = countByItem.get(item.id) ?? null;
    const endingCountQty = count?.counted_quantity ?? null;
    const unitCost = costMap.get(item.id) ?? 0;

    const actualUsageQty =
      endingCountQty == null ? null : beginning + purchasesQty - endingCountQty;
    const varianceQty = actualUsageQty == null ? null : actualUsageQty - theoreticalUsageQty;
    const variancePercent =
      varianceQty == null || theoreticalUsageQty <= 0
        ? null
        : (varianceQty / theoreticalUsageQty) * 100;
    const varianceCost = varianceQty == null ? null : varianceQty * unitCost;

    return {
      inventoryItemId: item.id,
      name: item.name,
      unitOfMeasure: item.unit_of_measure,
      beginningOnHand: beginning,
      purchasesQty,
      endingCountQty,
      actualUsageQty,
      theoreticalUsageQty,
      varianceQty,
      variancePercent,
      unitCost,
      varianceCost,
    };
  });
}
