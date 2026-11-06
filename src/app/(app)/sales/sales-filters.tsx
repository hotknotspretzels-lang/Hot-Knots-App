"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const GRANULARITY_LABELS: Record<string, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const RANGE_LABELS: Record<string, string> = {
  all: "All time",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
};

export function SalesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const granularity = searchParams.get("granularity") ?? "daily";
  const range = searchParams.get("range") ?? "30d";
  const day = searchParams.get("day") ?? new Date().toISOString().slice(0, 10);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/sales?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        items={GRANULARITY_LABELS}
        value={granularity}
        onValueChange={(v) => setParam("granularity", v ?? "daily")}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(GRANULARITY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {granularity === "hourly" ? (
        <Input
          type="date"
          value={day}
          onChange={(e) => setParam("day", e.target.value)}
          className="w-40"
        />
      ) : (
        <Select
          items={RANGE_LABELS}
          value={range}
          onValueChange={(v) => setParam("range", v ?? "30d")}
        >
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
      )}
    </div>
  );
}
