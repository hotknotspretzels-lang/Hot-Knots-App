"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function optionalText(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

export async function createCalendarTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "");
  if (!title || !dueDate) return;

  const supabase = await createClient();
  await supabase.from("calendar_tasks").insert({
    title,
    due_date: dueDate,
    due_time: optionalText(formData, "due_time"),
    contact_id: optionalText(formData, "contact_id"),
    notes: optionalText(formData, "notes"),
  });

  revalidatePath("/calendar");
}

export async function toggleCalendarTaskDone(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isDone = formData.get("is_done") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("calendar_tasks")
    .update({ is_done: !isDone })
    .eq("id", id);

  revalidatePath("/calendar");
}

export async function deleteCalendarTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("calendar_tasks").delete().eq("id", id);

  revalidatePath("/calendar");
}
