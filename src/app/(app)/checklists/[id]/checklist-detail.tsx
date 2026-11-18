"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Checklist, ChecklistItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EditList } from "./edit-list";
import { RunList } from "./run-list";

export function ChecklistDetail({
  checklist,
  items,
  initialMode,
}: {
  checklist: Checklist;
  items: ChecklistItem[];
  initialMode: "run" | "edit";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState(initialMode);
  const [, startMode] = useTransition();

  function showMode(next: "run" | "edit") {
    setMode(next);
    const href = next === "edit" ? `${pathname}?mode=edit` : pathname;
    startMode(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <Link href="/checklists" className="text-sm text-muted-foreground hover:text-foreground">
        ← Checklists
      </Link>
      <div>
        <h1 className="text-2xl font-semibold break-words">{checklist.name}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "run"
            ? "Check items off as you go. Uncheck all when the next event starts."
            : "Add items, rename the list, or change the order."}
        </p>
      </div>

      <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
        <button
          type="button"
          aria-pressed={mode === "run"}
          className={cn(
            "rounded-md py-2.5 text-sm font-medium",
            mode === "run" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => showMode("run")}
        >
          Run
        </button>
        <button
          type="button"
          aria-pressed={mode === "edit"}
          className={cn(
            "rounded-md py-2.5 text-sm font-medium",
            mode === "edit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
          onClick={() => showMode("edit")}
        >
          Edit
        </button>
      </div>

      {mode === "run" ? (
        <RunList checklistId={checklist.id} items={items} onEdit={() => showMode("edit")} />
      ) : (
        <EditList checklist={checklist} items={items} />
      )}
    </div>
  );
}
