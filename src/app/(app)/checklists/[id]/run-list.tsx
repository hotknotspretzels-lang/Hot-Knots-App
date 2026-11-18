"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChecklistItem } from "@/lib/types";
import { resetChecklistChecks, setChecklistItemChecked } from "../actions";
import { ChecklistProgress } from "../checklist-progress";
import { ConfirmDialog } from "../confirm-dialog";

export function RunList({
  checklistId,
  items,
  onEdit,
}: {
  checklistId: string;
  items: ChecklistItem[];
  onEdit: () => void;
}) {
  const [, startTransition] = useTransition();
  const [optimisticItems, addOptimistic] = useOptimistic(items, applyCheckUpdate);
  const done = optimisticItems.filter((item) => item.is_checked).length;

  function toggle(item: ChecklistItem, isChecked: boolean) {
    const formData = new FormData();
    formData.set("id", item.id);
    formData.set("checklist_id", checklistId);
    formData.set("is_checked", isChecked ? "true" : "false");
    startTransition(async () => {
      addOptimistic({ type: "set", id: item.id, is_checked: isChecked });
      const message = await setChecklistItemChecked(formData);
      if (message) toast.error(message);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ChecklistProgress done={done} total={optimisticItems.length} />

      {optimisticItems.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">Nothing on this list yet.</p>
          <Button type="button" variant="outline" onClick={onEdit}>
            Add items
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {optimisticItems.map((item) => (
            <li key={item.id}>
              <label
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 py-3 active:bg-muted ${
                  item.is_checked ? "text-muted-foreground" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={item.is_checked}
                  onChange={(event) => toggle(item, event.target.checked)}
                />
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[4px] border border-input text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                  <CheckIcon className="size-4" />
                </span>
                <span
                  className={`min-w-0 flex-1 text-base break-words ${
                    item.is_checked ? "line-through" : ""
                  }`}
                >
                  {item.title}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {done > 0 ? (
        <ConfirmDialog
          title="Uncheck everything?"
          description="Clears the checks so you can run this list again. The items stay."
          confirmLabel="Uncheck all"
          variant="outline"
          action={async (formData) => {
            addOptimistic({ type: "reset" });
            return resetChecklistChecks(formData);
          }}
          fields={{ checklist_id: checklistId }}
          trigger={
            <Button variant="outline" type="button" className="w-full">
              Uncheck all
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function applyCheckUpdate(
  state: ChecklistItem[],
  update: { type: "set"; id: string; is_checked: boolean } | { type: "reset" },
): ChecklistItem[] {
  if (update.type === "reset") {
    return state.map((item) => ({ ...item, is_checked: false, checked_at: null }));
  }
  return state.map((item) =>
    item.id === update.id ? { ...item, is_checked: update.is_checked } : item,
  );
}
