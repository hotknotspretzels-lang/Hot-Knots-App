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
import { Label } from "@/components/ui/label";
import type { Event } from "@/lib/types";

export function PrepControls({
  events,
  selectedEventId,
  attendance,
}: {
  events: Event[];
  selectedEventId: string;
  attendance: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/prep?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label className="text-xs">Event</Label>
        <Select
          items={Object.fromEntries(
            events.map((e) => [
              e.id,
              `${e.name} (${new Date(e.event_date + "T00:00:00").toLocaleDateString()})`,
            ]),
          )}
          value={selectedEventId}
          onValueChange={(v) => setParam("event_id", v)}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} ({new Date(e.event_date + "T00:00:00").toLocaleDateString()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-xs">Estimated attendance</Label>
        <Input
          type="number"
          min="0"
          value={attendance}
          onChange={(e) => setParam("attendance", e.target.value)}
          className="w-32"
        />
      </div>
    </div>
  );
}
