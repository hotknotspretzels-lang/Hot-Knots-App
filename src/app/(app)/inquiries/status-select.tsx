"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from "@/lib/types";
import { updateInquiryStatus } from "./actions";

const INQUIRY_STATUSES = Object.keys(INQUIRY_STATUS_LABELS) as InquiryStatus[];

export function InquiryStatusSelect({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <Select
        key={`${status}-${resetKey}`}
        name="status"
        items={INQUIRY_STATUS_LABELS}
        defaultValue={status}
        disabled={pending}
        onValueChange={(value) => {
          if (typeof value !== "string" || value === status) return;
          if (!INQUIRY_STATUSES.includes(value as InquiryStatus)) return;
          const next = value as InquiryStatus;
          startTransition(async () => {
            const message = await updateInquiryStatus(id, next);
            setError(message);
            if (message) setResetKey((key) => key + 1);
          });
        }}
      >
        <SelectTrigger className="h-8 w-32" aria-label="Inquiry status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {INQUIRY_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {INQUIRY_STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="max-w-32 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
