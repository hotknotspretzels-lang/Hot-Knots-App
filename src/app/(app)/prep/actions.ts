"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function savePrepPlan(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const basisNotes = String(formData.get("basis_notes") ?? "");
  const menuItemIds = formData.getAll("menu_item_id").map(String);
  const suggestedQtys = formData.getAll("suggested_qty").map((v) => Number(v));

  if (!eventId || menuItemIds.length === 0) return;

  const rows = menuItemIds.map((menuItemId, i) => ({
    event_id: eventId,
    menu_item_id: menuItemId,
    suggested_prep_qty: suggestedQtys[i],
    basis_notes: basisNotes,
  }));

  const supabase = await createClient();
  await supabase
    .from("prep_forecasts")
    .upsert(rows, { onConflict: "event_id,menu_item_id" });

  revalidatePath("/prep");
}

export async function savePrepActuals(formData: FormData) {
  const eventId = String(formData.get("event_id") ?? "");
  const menuItemIds = formData.getAll("menu_item_id").map(String);
  const actualPrepQtys = formData.getAll("actual_prep_qty").map((v) => Number(v));
  const actualSoldQtys = formData.getAll("actual_sold_qty").map((v) => Number(v));

  if (!eventId || menuItemIds.length === 0) return;

  const rows = menuItemIds.map((menuItemId, i) => ({
    event_id: eventId,
    menu_item_id: menuItemId,
    actual_prep_qty: Number.isNaN(actualPrepQtys[i]) ? null : actualPrepQtys[i],
    actual_sold_qty: Number.isNaN(actualSoldQtys[i]) ? null : actualSoldQtys[i],
  }));

  const supabase = await createClient();
  await supabase
    .from("prep_forecasts")
    .upsert(rows, { onConflict: "event_id,menu_item_id" });

  revalidatePath("/prep");
}
