"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InquiryStatus } from "@/lib/types";

const INQUIRY_STATUSES: readonly InquiryStatus[] = [
  "new",
  "contacted",
  "booked",
  "declined",
];

const INQUIRY_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function inquiryIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => INQUIRY_ID.test(id)))];
}

async function signedInClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "You need to be signed in." };
  return { supabase, error: null };
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<string | null> {
  if (!INQUIRY_ID.test(id) || !INQUIRY_STATUSES.includes(status)) {
    return "Could not update that inquiry.";
  }

  const { supabase, error: authError } = await signedInClient();
  if (!supabase) return authError;

  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) return error.message;

  revalidatePath("/inquiries");
  return null;
}

export async function setInquiriesRead(
  ids: string[],
  isRead: boolean,
): Promise<string | null> {
  if (typeof isRead !== "boolean") return "Could not update those inquiries.";

  const unique = inquiryIds(ids);
  if (unique.length === 0) return "Select at least one inquiry.";

  const { supabase, error: authError } = await signedInClient();
  if (!supabase) return authError;

  const { error } = await supabase
    .from("inquiries")
    .update({ is_read: isRead })
    .in("id", unique);
  if (error) return error.message;

  revalidatePath("/inquiries");
  return null;
}

export async function deleteInquiry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!INQUIRY_ID.test(id)) return;

  const { supabase } = await signedInClient();
  if (!supabase) return;

  await supabase.from("inquiries").delete().eq("id", id);
  revalidatePath("/inquiries");
}
