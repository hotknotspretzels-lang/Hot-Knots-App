"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIngredientCosts } from "@/lib/costing";
import type { InventoryItem, InventoryItemComponent, PaymentMethod } from "@/lib/types";

export async function createSalesTransaction(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const paymentMethod = String(formData.get("payment_method") ?? "cash") as PaymentMethod;
  const tax = Number(formData.get("tax") ?? 0) || 0;
  const tip = Number(formData.get("tip") ?? 0) || 0;
  const discount = Number(formData.get("discount") ?? 0) || 0;

  const menuItemIds = formData.getAll("menu_item_id").map(String);
  const quantities = formData.getAll("quantity").map((v) => Number(v));
  const unitPrices = formData.getAll("unit_price").map((v) => Number(v));

  if (!eventId || menuItemIds.length === 0) return;

  const lineItems = menuItemIds
    .map((menuItemId, i) => ({
      menu_item_id: menuItemId,
      quantity: quantities[i],
      unit_price: unitPrices[i],
    }))
    .filter((li) => li.menu_item_id && li.quantity > 0 && !Number.isNaN(li.unit_price));

  if (lineItems.length === 0) return;

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);
  const total = subtotal - discount + tax + tip;

  const supabase = await createClient();
  const { data: transaction, error } = await supabase
    .from("sales_transactions")
    .insert({
      event_id: eventId,
      payment_method: paymentMethod,
      subtotal,
      tax,
      tip,
      discount,
      total,
    })
    .select("id")
    .single();

  if (error || !transaction) return;

  await supabase.from("sales_line_items").insert(
    lineItems.map((li) => ({
      transaction_id: transaction.id,
      menu_item_id: li.menu_item_id,
      quantity: li.quantity,
      unit_price: li.unit_price,
      line_total: li.quantity * li.unit_price,
    })),
  );

  const [{ data: recipeComponents }, { data: ingredients }, { data: components }] =
    await Promise.all([
      supabase
        .from("recipe_components")
        .select("menu_item_id, inventory_item_id, quantity_per_unit")
        .in(
          "menu_item_id",
          lineItems.map((li) => li.menu_item_id),
        ),
      supabase.from("inventory_items").select("*"),
      supabase.from("inventory_item_components").select("*"),
    ]);

  const costMap = resolveIngredientCosts(
    (ingredients ?? []) as InventoryItem[],
    (components ?? []) as InventoryItemComponent[],
  );

  const usageRows = (recipeComponents ?? []).flatMap((rc) =>
    lineItems
      .filter((li) => li.menu_item_id === rc.menu_item_id)
      .map((li) => ({
        inventory_item_id: rc.inventory_item_id,
        event_id: eventId,
        sales_transaction_id: transaction.id,
        transaction_type: "usage" as const,
        quantity: rc.quantity_per_unit * li.quantity,
        unit_cost: costMap.get(rc.inventory_item_id) ?? 0,
      })),
  );

  if (usageRows.length > 0) {
    await supabase.from("inventory_transactions").insert(usageRows);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
  revalidatePath("/inventory");
}

export async function deleteSalesTransaction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("sales_transactions").delete().eq("id", id);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
  revalidatePath("/inventory");
}
