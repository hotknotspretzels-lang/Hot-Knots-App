import { createClient } from "@/lib/supabase/server";
import type { EmailAccount, EmailMessage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageList } from "./message-list";
import { syncMessages, disconnectAccount } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "That connection attempt looked invalid, so it was rejected. Try again.",
  not_configured:
    "Gmail integration isn't configured yet — GOOGLE_CLIENT_ID/SECRET are missing from the server environment.",
  token_exchange_failed: "Google didn't return a usable token. Try connecting again.",
  profile_fetch_failed: "Couldn't read the connected account's email address. Try again.",
  save_failed: "Connected to Google, but couldn't save the account. Try again.",
};

export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("*")
    .order("connected_at", { ascending: true });
  const accountList = (accounts ?? []) as EmailAccount[];

  const { data: messages } =
    accountList.length > 0
      ? await supabase
          .from("email_messages")
          .select("*")
          .in(
            "account_id",
            accountList.map((a) => a.id),
          )
          .order("received_at", { ascending: false })
      : { data: [] as EmailMessage[] };
  const messageList = (messages ?? []) as EmailMessage[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Email</h1>
        <p className="text-sm text-muted-foreground">
          A read-only mirror of your connected inbox — reply from Gmail directly for
          now.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">
            {ERROR_MESSAGES[error] ?? "Something went wrong connecting Gmail."}
          </CardContent>
        </Card>
      ) : null}

      {accountList.length === 0 ? (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Connect Gmail</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Connects with read-only access — nothing can be sent, modified, or
              deleted from this integration.
            </p>
            <Button
              nativeButton={false}
              render={<a href="/api/auth/gmail/connect">Connect Gmail</a>}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {accountList.map((account) => (
              <Card key={account.id}>
                <CardContent className="flex items-center gap-3 pt-6">
                  <span className="text-sm font-medium">{account.email_address}</span>
                  <form action={syncMessages}>
                    <input type="hidden" name="account_id" value={account.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Sync now
                    </Button>
                  </form>
                  <form action={disconnectAccount}>
                    <input type="hidden" name="account_id" value={account.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Disconnect
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>

          <MessageList messages={messageList} />
        </>
      )}
    </div>
  );
}
