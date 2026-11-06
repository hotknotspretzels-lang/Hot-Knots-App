"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeOnHand } from "@/lib/inventory";
import type { InventoryTransaction } from "@/lib/types";

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

const COUNT_RECONCILIATION_NOTE = "Stock count reconciliation";

export async function logPurchaseBatch(formData: FormData) {
  const transactionDate =
    String(formData.get("transaction_date") ?? "") || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const itemIds = formData.getAll("inventory_item_id").map(String);
  const quantities = formData.getAll("quantity").map((v) => Number(v));
  const unitCosts = formData.getAll("unit_cost").map((v) => (v ? Number(v) : null));

  const rows = itemIds
    .map((inventoryItemId, i) => ({
      inventoryItemId,
      quantity: quantities[i],
      unitCost:
        unitCosts[i] != null && !Number.isNaN(unitCosts[i]) ? unitCosts[i] : null,
    }))
    .filter((r) => r.inventoryItemId && r.quantity > 0 && !Number.isNaN(r.quantity));

  if (rows.length === 0) return;

  const supabase = await createClient();

  await supabase.from("inventory_transactions").insert(
    rows.map((r) => ({
      inventory_item_id: r.inventoryItemId,
      transaction_type: "purchase" as const,
      quantity: r.quantity,
      unit_cost: r.unitCost,
      transaction_date: transactionDate,
      notes,
    })),
  );

  await Promise.all(
    rows
      .filter((r) => r.unitCost != null)
      .map((r) =>
        supabase
          .from("inventory_items")
          .update({ current_unit_cost: r.unitCost })
          .eq("id", r.inventoryItemId),
      ),
  );

  revalidatePath("/inventory");
}

export async function logCount(formData: FormData) {
  const inventoryItemId = String(formData.get("inventory_item_id") ?? "");
  const countedQuantity = Number(formData.get("counted_quantity"));
  const countDate = String(formData.get("count_date") ?? "") || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!inventoryItemId || Number.isNaN(countedQuantity)) return;

  const supabase = await createClient();

  await supabase
    .from("inventory_counts")
    .upsert(
      {
        inventory_item_id: inventoryItemId,
        count_date: countDate,
        counted_quantity: countedQuantity,
        notes,
      },
      { onConflict: "inventory_item_id,count_date" },
    );

  // Remove any earlier auto-reconciliation for this same count so re-saving
  // doesn't compound — the delta is always recomputed from scratch below.
  await supabase
    .from("inventory_transactions")
    .delete()
    .eq("inventory_item_id", inventoryItemId)
    .eq("transaction_date", countDate)
    .eq("notes", COUNT_RECONCILIATION_NOTE);

  const { data: priorTransactions } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("inventory_item_id", inventoryItemId)
    .lte("transaction_date", countDate);

  const computedOnHand =
    computeOnHand((priorTransactions ?? []) as InventoryTransaction[]).get(
      inventoryItemId,
    ) ?? 0;
  const delta = countedQuantity - computedOnHand;

  if (delta !== 0) {
    await supabase.from("inventory_transactions").insert({
      inventory_item_id: inventoryItemId,
      transaction_type: "adjustment",
      quantity: delta,
      transaction_date: countDate,
      notes: COUNT_RECONCILIATION_NOTE,
    });
  }

  revalidatePath("/inventory");
}

export async function logUsage(formData: FormData) {
  const inventoryItemId = String(formData.get("inventory_item_id") ?? "");
  const quantity = Number(formData.get("quantity"));
  const transactionDate = String(formData.get("transaction_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!inventoryItemId || !quantity || Number.isNaN(quantity)) return;

  const supabase = await createClient();
  await supabase.from("inventory_transactions").insert({
    inventory_item_id: inventoryItemId,
    transaction_type: "usage",
    quantity,
    transaction_date: transactionDate || new Date().toISOString().slice(0, 10),
    notes,
  });

  revalidatePath("/inventory");
}

export async function logAdjustment(formData: FormData) {
  const inventoryItemId = String(formData.get("inventory_item_id") ?? "");
  const quantity = Number(formData.get("quantity"));
  const transactionDate = String(formData.get("transaction_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!inventoryItemId || !quantity || Number.isNaN(quantity)) return;

  const supabase = await createClient();
  await supabase.from("inventory_transactions").insert({
    inventory_item_id: inventoryItemId,
    transaction_type: "adjustment",
    quantity,
    transaction_date: transactionDate || new Date().toISOString().slice(0, 10),
    notes,
  });

  revalidatePath("/inventory");
}

export async function deleteInventoryItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("inventory_items").delete().eq("id", id);

  revalidatePath("/inventory");
}

export async function updateParLevels(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("inventory_items")
    .update({
      par_level: optionalNumber(formData, "par_level"),
      reorder_point: optionalNumber(formData, "reorder_point"),
    })
    .eq("id", id);

  revalidatePath("/inventory");
}
