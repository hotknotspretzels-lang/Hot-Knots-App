"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken, listRecentMessageIds, getMessage } from "@/lib/gmail";
import type { EmailAccount } from "@/lib/types";

export async function syncMessages(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");
  if (!accountId) return;

  const supabase = await createClient();
  const { data: account } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (!account) return;

  const accessToken = await getValidAccessToken(supabase, account as EmailAccount);
  if (!accessToken) return;

  const messageIds = await listRecentMessageIds(accessToken, 25);
  if (messageIds.length === 0) {
    revalidatePath("/email");
    return;
  }

  // Re-fetch every recent message, not just new ones — this lets fixes to
  // the body parser reach messages that were already synced, since upsert
  // overwrites the stored row. Local read-marking is preserved (once you've
  // opened a message here it stays read, regardless of its Gmail label).
  const { data: existingRows } = await supabase
    .from("email_messages")
    .select("gmail_message_id, is_read")
    .eq("account_id", accountId)
    .in("gmail_message_id", messageIds);
  const existingReadState = new Map(
    (existingRows ?? []).map((r) => [r.gmail_message_id, r.is_read]),
  );

  const fetched = await Promise.all(messageIds.map((id) => getMessage(accessToken, id)));
  const rows = fetched
    .filter((m) => m !== null)
    .map((m) => ({
      account_id: accountId,
      gmail_message_id: m.gmailMessageId,
      thread_id: m.threadId,
      from_name: m.fromName,
      from_address: m.fromAddress,
      subject: m.subject,
      snippet: m.snippet,
      body_text: m.bodyText,
      received_at: m.receivedAt,
      is_read: existingReadState.get(m.gmailMessageId) ?? m.isRead,
    }));

  if (rows.length > 0) {
    await supabase
      .from("email_messages")
      .upsert(rows, { onConflict: "account_id,gmail_message_id" });
  }

  revalidatePath("/email");
}

export async function disconnectAccount(formData: FormData) {
  const accountId = String(formData.get("account_id") ?? "");
  if (!accountId) return;

  const supabase = await createClient();
  await supabase.from("email_accounts").delete().eq("id", accountId);

  revalidatePath("/email");
}

export async function markMessageRead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("email_messages").update({ is_read: true }).eq("id", id);

  revalidatePath("/email");
}
