"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventDay } from "@/lib/types";

type DayRow = { key: number; date: string; start: string; end: string };

function nextDate(date: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${month}-${day}`;
}

// One row per day the event runs, each with its own start/end time. Submits
// index-aligned `day_date` / `day_start` / `day_end` fields.
export function EventDaysFields({
  defaultDate,
  initialDays,
}: {
  defaultDate?: string;
  initialDays?: EventDay[];
}) {
  const nextKey = useRef(initialDays?.length || 1);
  const [rows, setRows] = useState<DayRow[]>(() =>
    initialDays?.length
      ? initialDays.map((d, i) => ({
          key: i,
          date: d.day_date,
          start: d.start_time?.slice(0, 5) ?? "",
          end: d.end_time?.slice(0, 5) ?? "",
        }))
      : [{ key: 0, date: defaultDate ?? "", start: "", end: "" }],
  );

  function update(key: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addDay() {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          key: nextKey.current++,
          date: nextDate(last.date),
          start: last.start,
          end: last.end,
        },
      ];
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{rows.length > 1 ? "Days" : "Date"}</Label>
      {rows.map((row, i) => (
        <div key={row.key} className="flex flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <Input
              name="day_date"
              type="date"
              aria-label={`Day ${i + 1} date`}
              value={row.date}
              onChange={(e) => update(row.key, { date: e.target.value })}
              required
            />
            {rows.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
                title="Remove day"
                onClick={() =>
                  setRows((prev) => prev.filter((r) => r.key !== row.key))
                }
              >
                ×
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Start</span>
              <Input
                name="day_start"
                type="time"
                aria-label={`Day ${i + 1} start time`}
                value={row.start}
                onChange={(e) => update(row.key, { start: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">End</span>
              <Input
                name="day_end"
                type="time"
                aria-label={`Day ${i + 1} end time`}
                value={row.end}
                onChange={(e) => update(row.key, { end: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={addDay}
      >
        Add another day
      </Button>
    </div>
  );
}
