"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_STATUS_LABELS, CONTACT_TYPE_LABELS } from "@/lib/types";

const TYPE_ITEMS = { all: "All types", ...CONTACT_TYPE_LABELS };
const STATUS_ITEMS = { all: "All statuses", ...CONTACT_STATUS_LABELS };

export function ContactFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") ?? "all";
  const statusParam = searchParams.get("status") ?? "all";
  const type = typeParam in CONTACT_TYPE_LABELS ? typeParam : "all";
  const status = statusParam in CONTACT_STATUS_LABELS ? statusParam : "all";

  function setParam(key: "type" | "status", value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/contacts?${query}` : "/contacts");
  }

  return (
    <>
      <Select items={TYPE_ITEMS} value={type} onValueChange={(value) => setParam("type", value)}>
        <SelectTrigger className="w-44" aria-label="Filter by type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={STATUS_ITEMS}
        value={status}
        onValueChange={(value) => setParam("status", value)}
      >
        <SelectTrigger className="w-52" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
