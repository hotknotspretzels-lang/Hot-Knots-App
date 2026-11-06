"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContactType } from "@/lib/types";

function optionalText(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

export async function createContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  await supabase.from("contacts").insert({
    name,
    business_name: optionalText(formData, "business_name"),
    contact_type: (String(formData.get("contact_type") ?? "other") as ContactType),
    email: optionalText(formData, "email"),
    phone: optionalText(formData, "phone"),
    social_handle: optionalText(formData, "social_handle"),
    notes: optionalText(formData, "notes"),
  });

  revalidatePath("/contacts");
}

export async function updateContact(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const supabase = await createClient();
  await supabase
    .from("contacts")
    .update({
      name,
      business_name: optionalText(formData, "business_name"),
      contact_type: (String(formData.get("contact_type") ?? "other") as ContactType),
      email: optionalText(formData, "email"),
      phone: optionalText(formData, "phone"),
      social_handle: optionalText(formData, "social_handle"),
      notes: optionalText(formData, "notes"),
    })
    .eq("id", id);

  revalidatePath("/contacts");
}

export async function deleteContact(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("contacts").delete().eq("id", id);

  revalidatePath("/contacts");
}
