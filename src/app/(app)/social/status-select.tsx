"use client";

import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOCIAL_STRATEGY_STATUS_LABELS, type SocialStrategyStatus } from "@/lib/types";
import { updateStrategyStatus } from "./actions";

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: SocialStrategyStatus;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateStrategyStatus}>
      <input type="hidden" name="id" value={id} />
      <Select
        name="status"
        items={SOCIAL_STRATEGY_STATUS_LABELS}
        defaultValue={status}
        onValueChange={() => formRef.current?.requestSubmit()}
      >
        <SelectTrigger className="h-8 w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SOCIAL_STRATEGY_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
