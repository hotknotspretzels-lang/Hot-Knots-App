"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmailMessage } from "@/lib/types";
import { markMessageRead } from "./actions";

export function MessageList({ messages }: { messages: EmailMessage[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = messages.find((m) => m.id === selectedId) ?? null;

  function selectMessage(message: EmailMessage) {
    setSelectedId(message.id);
    if (!message.is_read) {
      const formData = new FormData();
      formData.set("id", message.id);
      markMessageRead(formData);
    }
  }

  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground">
        No messages synced yet. Click &quot;Sync now&quot; to pull your recent inbox.
      </p>
    );
  }

  if (selected) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setSelectedId(null)}
          >
            ← Back to inbox
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              {selected.subject || "(no subject)"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selected.from_name
                ? `${selected.from_name} <${selected.from_address}>`
                : selected.from_address}
              {selected.received_at
                ? ` · ${new Date(selected.received_at).toLocaleString()}`
                : ""}
            </p>
          </div>
          <div className="whitespace-pre-wrap text-sm">
            {selected.body_text || selected.snippet}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {messages.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => selectMessage(m)}
          className={cn(
            "flex flex-col gap-0.5 rounded-md border border-transparent p-2 text-left text-sm transition-colors hover:bg-muted",
          )}
        >
          <span className={cn("truncate", !m.is_read && "font-semibold")}>
            {m.from_name || m.from_address || "Unknown sender"}
          </span>
          <span className={cn("truncate", !m.is_read && "font-medium")}>
            {m.subject || "(no subject)"}
          </span>
          <span className="truncate text-xs text-muted-foreground">{m.snippet}</span>
        </button>
      ))}
    </div>
  );
}
