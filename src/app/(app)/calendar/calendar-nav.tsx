"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CalendarNav({
  monthLabel,
  year,
  monthIndex,
}: {
  monthLabel: string;
  year: number;
  monthIndex: number;
}) {
  const router = useRouter();

  function go(offset: number) {
    const d = new Date(year, monthIndex - 1 + offset, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/calendar?month=${m}`);
  }

  function goToday() {
    const now = new Date();
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/calendar?month=${m}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => go(-1)}>
        ← Prev
      </Button>
      <Button variant="outline" size="sm" onClick={goToday}>
        Today
      </Button>
      <Button variant="outline" size="sm" onClick={() => go(1)}>
        Next →
      </Button>
      <span className="ml-2 text-sm font-medium">{monthLabel}</span>
    </div>
  );
}
