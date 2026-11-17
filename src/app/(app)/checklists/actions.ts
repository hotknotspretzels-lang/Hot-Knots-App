"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parsePositiveInt, parseQuantity } from "@/lib/checklists";

async function signedInClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return supabase;
}

function revalidateChecklist(id?: string) {
  revalidatePath("/checklists");
  if (id) revalidatePath(`/checklists/${id}`);
}

function readId(formData: FormData, key: string): string | null {
  const id = String(formData.get(key) ?? "");
  return isUuid(id) ? id : null;
}

function parseChecklistName(raw: unknown): string | null {
  const name = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!name || name.length > 120) return null;
  return name;
}

function itemFromForm(
  formData: FormData,
): { error: string } | { data: { title: string; quantity: number | null; unit: string | null; scales: boolean } } {
  const title = String(formData.get("title") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!title) return { error: "Add a name for this item." };
  if (title.length > 200) return { error: "Item name needs to be 200 characters or less." };

  const quantityRaw = String(formData.get("quantity") ?? "");
  const unit = String(formData.get("unit") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (unit.length > 40) return { error: "Unit needs to be 40 characters or less." };

  if (!quantityRaw.trim()) {
    return { data: { title, quantity: null, unit: null, scales: true } };
  }

  const quantity = parseQuantity(quantityRaw);
  if (quantity == null) return { error: "Quantity needs to be a number greater than zero." };

  return {
    data: {
      title,
      quantity,
      unit: unit || null,
      scales: formData.get("scales") === "true",
    },
  };
}

export async function createChecklist(formData: FormData): Promise<string | null> {
  const name = parseChecklistName(formData.get("name"));
  if (!name) return "Give the checklist a name, up to 120 characters.";

  const baseRaw = String(formData.get("base_customer_count") ?? "").trim();
  const base = baseRaw === "" ? 100 : parsePositiveInt(baseRaw);
  if (base == null) return "Base customer count needs to be a whole number, 1 or more.";

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { data: last } = await supabase
    .from("checklists")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("checklists")
    .insert({
      name,
      base_customer_count: base,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !data) return error?.message ?? "Could not create that checklist.";

  revalidateChecklist(data.id);
  redirect(`/checklists/${data.id}?mode=edit`);
}

export async function updateChecklist(formData: FormData): Promise<string | null> {
  const id = readId(formData, "id");
  if (!id) return "Could not update that checklist.";

  const name = parseChecklistName(formData.get("name"));
  if (!name) return "Give the checklist a name, up to 120 characters.";

  const base = parsePositiveInt(String(formData.get("base_customer_count") ?? ""));
  if (base == null) return "Base customer count needs to be a whole number, 1 or more.";

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase
    .from("checklists")
    .update({ name, base_customer_count: base })
    .eq("id", id);
  if (error) return error.message;

  revalidateChecklist(id);
  return null;
}

export async function setChecklistExpectedCount(formData: FormData): Promise<string | null> {
  const id = readId(formData, "id");
  if (!id) return "Could not update the customer count.";

  const raw = String(formData.get("expected_customer_count") ?? "").trim();
  let expected: number | null = null;
  if (raw !== "") {
    expected = parsePositiveInt(raw);
    if (expected == null) return "Expected customers needs to be a whole number, 1 or more.";
  }

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase
    .from("checklists")
    .update({ expected_customer_count: expected })
    .eq("id", id);
  if (error) return error.message;

  revalidateChecklist(id);
  return null;
}

export async function deleteChecklist(formData: FormData): Promise<string | null> {
  const id = readId(formData, "id");
  if (!id) return "Could not delete that checklist.";

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase.from("checklists").delete().eq("id", id);
  if (error) return error.message;

  revalidateChecklist(id);
  if (formData.get("redirect") === "list") redirect("/checklists");
  return null;
}

export async function createChecklistItem(formData: FormData): Promise<string | null> {
  const checklistId = readId(formData, "checklist_id");
  if (!checklistId) return "Could not add that item.";

  const parsed = itemFromForm(formData);
  if ("error" in parsed) return parsed.error;

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { data: last } = await supabase
    .from("checklist_items")
    .select("sort_order")
    .eq("checklist_id", checklistId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("checklist_items").insert({
    checklist_id: checklistId,
    ...parsed.data,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) return error.message;

  revalidateChecklist(checklistId);
  return null;
}

export async function updateChecklistItem(formData: FormData): Promise<string | null> {
  const id = readId(formData, "id");
  const checklistId = readId(formData, "checklist_id");
  if (!id || !checklistId) return "Could not update that item.";

  const parsed = itemFromForm(formData);
  if ("error" in parsed) return parsed.error;

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase
    .from("checklist_items")
    .update(parsed.data)
    .eq("id", id)
    .eq("checklist_id", checklistId);
  if (error) return error.message;

  revalidateChecklist(checklistId);
  return null;
}

export async function deleteChecklistItem(formData: FormData): Promise<string | null> {
  const id = readId(formData, "id");
  const checklistId = readId(formData, "checklist_id");
  if (!id || !checklistId) return "Could not delete that item.";

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", id)
    .eq("checklist_id", checklistId);
  if (error) return error.message;

  revalidateChecklist(checklistId);
  return null;
}

export async function moveChecklistItem(formData: FormData): Promise<string | null> {
  const id = readId(formData, "id");
  const checklistId = readId(formData, "checklist_id");
  const direction = formData.get("direction") === "up" ? -1 : 1;
  if (!id || !checklistId) return "Could not reorder that item.";

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { data: rows, error: readError } = await supabase
    .from("checklist_items")
    .select("id, sort_order")
    .eq("checklist_id", checklistId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (readError) return readError.message;

  const items = rows ?? [];
  const index = items.findIndex((item) => item.id === id);
  const swapIndex = index + direction;
  if (index < 0 || swapIndex < 0 || swapIndex >= items.length) return null;

  const current = items[index];
  const neighbor = items[swapIndex];
  const currentOrder = current.sort_order;
  const neighborOrder = neighbor.sort_order;

  if (currentOrder === neighborOrder) {
    const ordered = items.slice();
    const [moved] = ordered.splice(index, 1);
    ordered.splice(swapIndex, 0, moved);
    const updates = ordered.map((item, position) =>
      supabase.from("checklist_items").update({ sort_order: position }).eq("id", item.id),
    );
    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) return failed.error.message;
  } else {
    const [first, second] = await Promise.all([
      supabase.from("checklist_items").update({ sort_order: neighborOrder }).eq("id", current.id),
      supabase.from("checklist_items").update({ sort_order: currentOrder }).eq("id", neighbor.id),
    ]);
    if (first.error) return first.error.message;
    if (second.error) return second.error.message;
  }

  revalidateChecklist(checklistId);
  return null;
}

export async function setChecklistItemChecked(formData: FormData): Promise<string | null> {
  const id = readId(formData, "id");
  const checklistId = readId(formData, "checklist_id");
  if (!id || !checklistId) return "Could not update that item.";

  const isChecked = formData.get("is_checked") === "true";
  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase
    .from("checklist_items")
    .update({
      is_checked: isChecked,
      checked_at: isChecked ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("checklist_id", checklistId);
  if (error) return error.message;

  revalidateChecklist(checklistId);
  return null;
}

export async function resetChecklistChecks(formData: FormData): Promise<string | null> {
  const checklistId = readId(formData, "checklist_id");
  if (!checklistId) return "Could not reset that checklist.";

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase
    .from("checklist_items")
    .update({ is_checked: false, checked_at: null })
    .eq("checklist_id", checklistId);
  if (error) return error.message;

  revalidateChecklist(checklistId);
  return null;
}
