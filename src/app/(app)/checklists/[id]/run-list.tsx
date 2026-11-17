"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Checklist, ChecklistItem } from "@/lib/types";
import { formatPackQuantity, packQuantity, parsePositiveInt, scaleSummary } from "@/lib/checklists";
import { resetChecklistChecks, setChecklistExpectedCount, setChecklistItemChecked } from "../actions";
import { ChecklistProgress } from "../checklist-progress";
import { ConfirmDialog } from "../confirm-dialog";

export function RunList({
  checklist,
  items,
  onEdit,
}: {
  checklist: Checklist;
  items: ChecklistItem[];
  onEdit: () => void;
}) {
  const [draft, setDraft] = useState(
    checklist.expected_customer_count?.toString() ?? "",
  );
  const [countError, setCountError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimisticItems, addOptimistic] = useOptimistic(items, applyCheckUpdate);

  const trimmed = draft.trim();
  const parsed = trimmed === "" ? null : parsePositiveInt(trimmed);
  const draftInvalid = trimmed !== "" && parsed == null;
  const expectedForDisplay = draftInvalid ? checklist.expected_customer_count : parsed;
  const saved = checklist.expected_customer_count;
  const dirty = !draftInvalid && parsed !== saved;

  const done = optimisticItems.filter((item) => item.is_checked).length;

  async function saveCount(): Promise<string | null> {
    if (draftInvalid || !dirty) return null;
    const formData = new FormData();
    formData.set("id", checklist.id);
    if (parsed != null) formData.set("expected_customer_count", String(parsed));
    const message = await setChecklistExpectedCount(formData);
    if (message) setCountError(message);
    else setCountError(null);
    return message;
  }

  function persistCount() {
    startTransition(async () => {
      const message = await saveCount();
      if (message) toast.error(message);
    });
  }

  function toggle(item: ChecklistItem, isChecked: boolean) {
    const formData = new FormData();
    formData.set("id", item.id);
    formData.set("checklist_id", checklist.id);
    formData.set("is_checked", isChecked ? "true" : "false");
    startTransition(async () => {
      addOptimistic({ type: "set", id: item.id, is_checked: isChecked });
      const message = await setChecklistItemChecked(formData);
      if (message) toast.error(message);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ChecklistProgress done={done} total={items.length} />

      <form
        className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        action={() => persistCount()}
      >
        <Label htmlFor="expected-customers">Expected customers</Label>
        <div className="flex gap-2">
          <Input
            id="expected-customers"
            name="expected_customer_count"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setCountError(null);
            }}
            onBlur={persistCount}
            className="h-11 text-base"
            placeholder="Headcount"
          />
          <Button type="submit" className="h-11 px-4" disabled={pending || draftInvalid || !dirty}>
            Scale
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {scaleSummary(checklist.base_customer_count, expectedForDisplay)}
        </p>
        {countError ? (
          <p role="alert" className="text-sm text-destructive">
            {countError}
          </p>
        ) : null}
        {draftInvalid ? (
          <p role="alert" className="text-sm text-destructive">
            Enter a whole number, 1 or more, or clear the field to use the base amounts.
          </p>
        ) : null}
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">Nothing on this list yet.</p>
          <Button type="button" variant="outline" onClick={onEdit}>
            Add items
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {optimisticItems.map((item) => {
            const amount = packQuantity(
              item,
              checklist.base_customer_count,
              expectedForDisplay,
            );
            const quantityLabel =
              amount == null ? null : formatPackQuantity(amount, item.unit);
            return (
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
                  {quantityLabel ? (
                    <span className="shrink-0 text-right text-base font-medium tabular-nums">
                      {quantityLabel}
                      {item.quantity != null && !item.scales ? (
                        <span className="block text-xs font-normal text-muted-foreground no-underline">
                          fixed
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {done > 0 ? (
        <ConfirmDialog
          title="Uncheck everything?"
          description="Clears the checks so you can run this list again. The items and quantities stay."
          confirmLabel="Uncheck all"
          variant="outline"
          action={async (formData) => {
            addOptimistic({ type: "reset" });
            return resetChecklistChecks(formData);
          }}
          fields={{ checklist_id: checklist.id }}
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
