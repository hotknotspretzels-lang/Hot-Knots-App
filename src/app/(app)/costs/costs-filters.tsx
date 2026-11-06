"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RANGE_LABELS: Record<string, string> = {
  all: "All time",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export function CostsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const range = searchParams.get("range") ?? "30d";

  function setRange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "30d") {
      params.delete("range");
    } else {
      params.set("range", value);
    }
    router.push(`/costs?${params.toString()}`);
  }

  return (
    <Select items={RANGE_LABELS} value={range} onValueChange={setRange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(RANGE_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
