"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contactWriteFromForm } from "./contact-payload";

const CONTACT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function signedInClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return supabase;
}

function revalidateContactViews(id?: string) {
  revalidatePath("/contacts");
  if (id) revalidatePath(`/contacts/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/events", "layout");
}

export async function createContact(formData: FormData): Promise<string | null> {
  const parsed = contactWriteFromForm(formData);
  if ("error" in parsed) return parsed.error;

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase.from("contacts").insert(parsed.data);
  if (error) return error.message;

  revalidateContactViews();
  return null;
}

export async function updateContact(formData: FormData): Promise<string | null> {
  const id = String(formData.get("id") ?? "");
  if (!CONTACT_ID.test(id)) return "Could not update that contact.";

  const parsed = contactWriteFromForm(formData);
  if ("error" in parsed) return parsed.error;

  const supabase = await signedInClient();
  if (!supabase) return "You need to be signed in.";

  const { error } = await supabase.from("contacts").update(parsed.data).eq("id", id);
  if (error) return error.message;

  revalidateContactViews(id);
  return null;
}

export async function deleteContact(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!CONTACT_ID.test(id)) return;

  const supabase = await signedInClient();
  if (!supabase) return;

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return;

  revalidateContactViews(id);
  if (formData.get("redirect_to") === "/contacts") {
    redirect("/contacts");
  }
}
