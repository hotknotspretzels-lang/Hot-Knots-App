"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTodoCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("todo_categories").insert({ name });
  revalidatePath("/todos");
}

export async function deleteTodoCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("todo_categories").delete().eq("id", id);
  revalidatePath("/todos");
}

export async function createTodoItem(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "");
  if (!title || !categoryId) return;

  const supabase = await createClient();
  await supabase.from("todo_items").insert({ title, category_id: categoryId });
  revalidatePath("/todos");
}

export async function setTodoItemDone(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isDone = formData.get("is_done") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("todo_items")
    .update({ is_done: isDone, completed_at: isDone ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/todos");
}
