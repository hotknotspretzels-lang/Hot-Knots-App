"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteChecklist } from "./actions";
import { ConfirmDialog } from "./confirm-dialog";

export function DeleteChecklistDialog({
  id,
  name,
  itemCount,
  redirectToList = false,
  label = "icon",
}: {
  id: string;
  name: string;
  itemCount: number;
  redirectToList?: boolean;
  label?: "icon" | "text";
}) {
  const itemLabel =
    itemCount === 0
      ? "This list is empty."
      : `This also deletes its ${itemCount} item${itemCount === 1 ? "" : "s"}.`;

  return (
    <ConfirmDialog
      title={`Delete “${name}”?`}
      description={`${itemLabel} This can't be undone.`}
      confirmLabel="Delete checklist"
      action={deleteChecklist}
      fields={{ id, ...(redirectToList ? { redirect: "list" } : {}) }}
      trigger={
        label === "text" ? (
          <Button variant="destructive" size="sm" type="button">
            Delete checklist
          </Button>
        ) : (
          <Button variant="ghost" size="icon" type="button" aria-label={`Delete ${name}`}>
            <Trash2Icon />
          </Button>
        )
      }
    />
  );
}
