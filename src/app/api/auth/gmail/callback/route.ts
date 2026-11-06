import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, fetchGmailProfile } from "@/lib/gmail";

function redirectWithError(request: Request, reason: string) {
  const response = NextResponse.redirect(new URL(`/email?error=${reason}`, request.url));
  response.cookies.delete("gmail_oauth_state");
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("gmail_oauth_state")?.value;

  if (oauthError) return redirectWithError(request, oauthError);
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(request, "invalid_state");
  }

  const redirectUri = new URL("/api/auth/gmail/callback", request.url).toString();

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code, redirectUri);
  } catch {
    return redirectWithError(request, "not_configured");
  }

  if (!tokens || !tokens.refresh_token) {
    return redirectWithError(request, "token_exchange_failed");
  }

  const profile = await fetchGmailProfile(tokens.access_token);
  if (!profile) {
    return redirectWithError(request, "profile_fetch_failed");
  }

  const supabase = await createClient();
  const { error: upsertError } = await supabase.from("email_accounts").upsert(
    {
      email_address: profile.emailAddress,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    },
    { onConflict: "email_address" },
  );

  if (upsertError) {
    console.error("email_accounts upsert error:", upsertError);
    return redirectWithError(request, "save_failed");
  }

  const response = NextResponse.redirect(new URL("/email", request.url));
  response.cookies.delete("gmail_oauth_state");
  return response;
}
