"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory } from "@/lib/types";

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export async function createExpense(formData: FormData) {
  const category = String(formData.get("category") ?? "") as ExpenseCategory;
  const amount = Number(formData.get("amount"));
  const expenseDate = String(formData.get("expense_date") ?? "");
  const eventId = String(formData.get("event_id") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!category || !amount || Number.isNaN(amount)) return;

  const supabase = await createClient();
  await supabase.from("expenses").insert({
    category,
    amount,
    event_id: eventId,
    expense_date: expenseDate || new Date().toISOString().slice(0, 10),
    mileage: optionalNumber(formData, "mileage"),
    gallons: optionalNumber(formData, "gallons"),
    notes,
  });

  revalidatePath("/costs");
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "") || null;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);

  revalidatePath("/costs");
  if (eventId) revalidatePath(`/events/${eventId}`);
}
