"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveIngredientCosts } from "@/lib/costing";
import type { InventoryCategory, InventoryItem, InventoryItemComponent } from "@/lib/types";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("menu_categories").insert({ name });
  revalidatePath("/inventory");
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("menu_categories").delete().eq("id", id);
  revalidatePath("/inventory");
}

export async function createMenuItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const unit = String(formData.get("unit_of_measure") ?? "each").trim() || "each";

  if (!name || Number.isNaN(price)) return;

  const supabase = await createClient();
  await supabase.from("menu_items").insert({
    name,
    price,
    category_id: categoryId,
    unit_of_measure: unit,
  });
  revalidatePath("/inventory");
}

export async function toggleMenuItemActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("menu_items").update({ is_active: !isActive }).eq("id", id);
  revalidatePath("/inventory");
}

export async function deleteMenuItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("menu_items").delete().eq("id", id);
  revalidatePath("/inventory");
}

export async function createIngredient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "food") as InventoryCategory;
  const unit = String(formData.get("unit_of_measure") ?? "unit").trim() || "unit";
  const isPrepared = formData.get("is_prepared") === "true";

  if (!name) return;

  const supabase = await createClient();

  if (isPrepared) {
    const yieldQuantity = Number(formData.get("yield_quantity"));
    const yieldUnit = String(formData.get("yield_unit_of_measure") ?? "").trim() || unit;
    if (!yieldQuantity || Number.isNaN(yieldQuantity)) return;

    await supabase.from("inventory_items").insert({
      name,
      category,
      unit_of_measure: unit,
      is_prepared: true,
      yield_quantity: yieldQuantity,
      yield_unit_of_measure: yieldUnit,
    });
  } else {
    const costRaw = formData.get("current_unit_cost");
    const cost = costRaw ? Number(costRaw) : null;

    await supabase.from("inventory_items").insert({
      name,
      category,
      unit_of_measure: unit,
      is_prepared: false,
      current_unit_cost: cost,
    });
  }

  revalidatePath("/inventory");
}

export async function updateIngredientCost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const cost = Number(formData.get("current_unit_cost"));
  if (!id || Number.isNaN(cost)) return;

  const supabase = await createClient();
  await supabase.from("inventory_items").update({ current_unit_cost: cost }).eq("id", id);
  revalidatePath("/inventory");
}

export async function saveRecipe(formData: FormData) {
  const targetType = String(formData.get("target_type") ?? "");
  const targetId = String(formData.get("target_id") ?? "");
  if (!targetId || (targetType !== "menu_item" && targetType !== "inventory_item")) return;

  const componentIds = formData.getAll("component_id").map(String);
  const quantities = formData.getAll("quantity").map((v) => Number(v));

  const rows = componentIds
    .map((componentId, i) => ({ componentId, quantity: quantities[i] }))
    .filter(
      (r) =>
        r.componentId &&
        r.quantity > 0 &&
        !Number.isNaN(r.quantity) &&
        r.componentId !== targetId,
    );

  const supabase = await createClient();

  if (targetType === "menu_item") {
    await supabase.from("recipe_components").delete().eq("menu_item_id", targetId);
    if (rows.length > 0) {
      await supabase.from("recipe_components").insert(
        rows.map((r) => ({
          menu_item_id: targetId,
          inventory_item_id: r.componentId,
          quantity_per_unit: r.quantity,
        })),
      );
    }
  } else {
    await supabase.from("inventory_item_components").delete().eq("parent_item_id", targetId);
    if (rows.length > 0) {
      await supabase.from("inventory_item_components").insert(
        rows.map((r) => ({
          parent_item_id: targetId,
          component_item_id: r.componentId,
          quantity: r.quantity,
        })),
      );
    }
  }

  revalidatePath("/inventory");
}

export async function logWaste(formData: FormData) {
  const inventoryItemId = String(formData.get("inventory_item_id") ?? "");
  const quantity = Number(formData.get("quantity"));
  const transactionDate = String(formData.get("transaction_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!inventoryItemId || !quantity || Number.isNaN(quantity)) return;

  const supabase = await createClient();

  const [{ data: ingredients }, { data: components }] = await Promise.all([
    supabase.from("inventory_items").select("*"),
    supabase.from("inventory_item_components").select("*"),
  ]);

  const costMap = resolveIngredientCosts(
    (ingredients ?? []) as InventoryItem[],
    (components ?? []) as InventoryItemComponent[],
  );
  const unitCost = costMap.get(inventoryItemId) ?? 0;

  await supabase.from("inventory_transactions").insert({
    inventory_item_id: inventoryItemId,
    transaction_type: "waste",
    quantity,
    unit_cost: unitCost,
    transaction_date: transactionDate || new Date().toISOString().slice(0, 10),
    notes,
  });

  revalidatePath("/inventory");
}
