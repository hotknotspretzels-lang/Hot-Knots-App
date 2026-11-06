"use client";

import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from "@/lib/types";
import { updateInquiryStatus } from "./actions";

export function InquiryStatusSelect({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateInquiryStatus}>
      <input type="hidden" name="id" value={id} />
      <Select
        name="status"
        items={INQUIRY_STATUS_LABELS}
        defaultValue={status}
        onValueChange={() => formRef.current?.requestSubmit()}
      >
        <SelectTrigger className="h-8 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(INQUIRY_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
