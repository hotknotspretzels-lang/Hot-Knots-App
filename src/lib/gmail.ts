import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailAccount } from "@/lib/types";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

function requireClientCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set — Gmail integration isn't configured yet.",
    );
  }
  return { clientId, clientSecret };
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const { clientId, clientSecret } = requireClientCredentials();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) return null;
  return (await res.json()) as TokenResponse;
}

async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = requireClientCredentials();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  return (await res.json()) as TokenResponse;
}

export async function getValidAccessToken(
  supabase: SupabaseClient,
  account: EmailAccount,
): Promise<string | null> {
  const expiresAt = new Date(account.token_expires_at).getTime();
  const bufferMs = 60_000;

  if (expiresAt - bufferMs > Date.now()) {
    return account.access_token;
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  if (!refreshed) return null;

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from("email_accounts")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", account.id);

  return refreshed.access_token;
}

export async function fetchGmailProfile(accessToken: string) {
  const res = await fetch(`${GMAIL_API}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as { emailAddress: string };
}

export async function listRecentMessageIds(
  accessToken: string,
  max = 25,
): Promise<string[]> {
  const url = `${GMAIL_API}/messages?maxResults=${max}&labelIds=INBOX`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { messages?: { id: string }[] };
  return (data.messages ?? []).map((m) => m.id);
}

interface GmailPayloadPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPayloadPart[];
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (m) => HTML_ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|table|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]*\n[ \t]*/g, "\n")
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

// Some senders' "plain text" MIME part is itself a naive HTML-to-text
// conversion that leaves behind comments or conditional-comment markers —
// so every path gets the same cleanup pass, not just the HTML one.
function cleanBodyText(text: string): string {
  if (/<[a-z!/][\s\S]*>/i.test(text)) return stripHtml(text);
  return decodeEntities(text).trim();
}

export function extractPlainTextBody(payload: GmailPayloadPart): string {
  function findPart(part: GmailPayloadPart, mimeType: string): GmailPayloadPart | null {
    if (part.mimeType === mimeType && part.body?.data) return part;
    for (const child of part.parts ?? []) {
      const found = findPart(child, mimeType);
      if (found) return found;
    }
    return null;
  }

  // Prefer HTML when present: we fully control its tag/style/comment
  // stripping, whereas a sender's own "plain text" part is sometimes a
  // lossy, half-broken conversion (see CSS_BLOCK_START above).
  const html = findPart(payload, "text/html");
  if (html?.body?.data) return cleanBodyText(decodeBase64Url(html.body.data));

  const plain = findPart(payload, "text/plain");
  if (plain?.body?.data) return cleanBodyText(decodeBase64Url(plain.body.data));

  return "";
}

function parseFromHeader(value: string): { name: string | null; address: string | null } {
  const match = value.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const name = match[1].replace(/"/g, "").trim();
    return { name: name || null, address: match[2].trim() };
  }
  return { name: null, address: value.trim() || null };
}

export interface ParsedGmailMessage {
  gmailMessageId: string;
  threadId: string | null;
  fromName: string | null;
  fromAddress: string | null;
  subject: string | null;
  snippet: string | null;
  bodyText: string;
  receivedAt: string | null;
  isRead: boolean;
}

export async function getMessage(
  accessToken: string,
  id: string,
): Promise<ParsedGmailMessage | null> {
  const res = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    id: string;
    threadId: string;
    snippet?: string;
    internalDate?: string;
    labelIds?: string[];
    payload: GmailPayloadPart & {
      headers?: { name: string; value: string }[];
    };
  };

  const headers = data.payload.headers ?? [];
  const fromHeader = headers.find((h) => h.name === "From")?.value ?? "";
  const subject = headers.find((h) => h.name === "Subject")?.value ?? null;
  const { name, address } = parseFromHeader(fromHeader);

  return {
    gmailMessageId: data.id,
    threadId: data.threadId ?? null,
    fromName: name,
    fromAddress: address,
    subject: subject ? decodeEntities(subject) : null,
    snippet: data.snippet ? decodeEntities(data.snippet) : null,
    bodyText: extractPlainTextBody(data.payload),
    receivedAt: data.internalDate
      ? new Date(Number(data.internalDate)).toISOString()
      : null,
    isRead: !(data.labelIds ?? []).includes("UNREAD"),
  };
}
