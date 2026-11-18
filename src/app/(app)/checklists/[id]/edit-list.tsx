"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Checklist, ChecklistItem } from "@/lib/types";
import { formatStoredQuantity } from "@/lib/checklists";
import {
  createChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
  updateChecklist,
  updateChecklistItem,
} from "../actions";
import { ConfirmDialog } from "../confirm-dialog";
import { DeleteChecklistDialog } from "../delete-checklist-dialog";
import { ItemFields } from "./item-fields";

function storedLabel(item: ChecklistItem): string {
  if (item.quantity == null) return "Plain checkbox";
  const amount = `${formatStoredQuantity(item.quantity)}${item.unit ? ` ${item.unit}` : ""}`;
  return item.scales ? `${amount} · scales` : `${amount} · fixed`;
}

export function EditList({ checklist, items }: { checklist: Checklist; items: ChecklistItem[] }) {
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [addKey, setAddKey] = useState(0);
  const [settingsPending, startSettings] = useTransition();
  const [addPending, startAdd] = useTransition();
  const [editPending, startEdit] = useTransition();
  const [movePending, startMove] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        action={(formData) => {
          setSettingsError(null);
          startSettings(async () => {
            const message = await updateChecklist(formData);
            setSettingsError(message);
          });
        }}
      >
        <input type="hidden" name="id" value={checklist.id} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-checklist-name">Name</Label>
          <Input
            id="edit-checklist-name"
            name="name"
            required
            maxLength={120}
            defaultValue={checklist.name}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-checklist-base">Written for how many customers?</Label>
          <Input
            id="edit-checklist-base"
            name="base_customer_count"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            defaultValue={checklist.base_customer_count}
          />
          <p className="text-xs text-muted-foreground">
            Item quantities below are the amounts for this many customers. Changing the number does
            not rewrite those quantities.
          </p>
        </div>
        {settingsError ? (
          <p role="alert" className="text-sm text-destructive">
            {settingsError}
          </p>
        ) : null}
        <Button type="submit" variant="outline" disabled={settingsPending}>
          {settingsPending ? "Saving…" : "Save checklist"}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Items</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
              >
                <div className="flex shrink-0 flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${item.title} up`}
                    disabled={index === 0 || movePending}
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("id", item.id);
                      formData.set("checklist_id", checklist.id);
                      formData.set("direction", "up");
                      startMove(async () => {
                        const message = await moveChecklistItem(formData);
                        if (message) toast.error(message);
                      });
                    }}
                  >
                    <ChevronUpIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${item.title} down`}
                    disabled={index === items.length - 1 || movePending}
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("id", item.id);
                      formData.set("checklist_id", checklist.id);
                      formData.set("direction", "down");
                      startMove(async () => {
                        const message = await moveChecklistItem(formData);
                        if (message) toast.error(message);
                      });
                    }}
                  >
                    <ChevronDownIcon />
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{storedLabel(item)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${item.title}`}
                  onClick={() => {
                    setEditError(null);
                    setEditing(item);
                  }}
                >
                  <PencilIcon />
                </Button>
                <ConfirmDialog
                  title={`Remove “${item.title}”?`}
                  description="This takes the item off the checklist."
                  confirmLabel="Remove item"
                  action={deleteChecklistItem}
                  fields={{ id: item.id, checklist_id: checklist.id }}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2Icon />
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        action={(formData) => {
          setAddError(null);
          startAdd(async () => {
            const message = await createChecklistItem(formData);
            setAddError(message);
            if (!message) setAddKey((key) => key + 1);
          });
        }}
      >
        <input type="hidden" name="checklist_id" value={checklist.id} />
        <h2 className="text-base font-medium">Add an item</h2>
        <ItemFields key={addKey} idPrefix="add-item" />
        {addError ? (
          <p role="alert" className="text-sm text-destructive">
            {addError}
          </p>
        ) : null}
        <Button type="submit" disabled={addPending}>
          {addPending ? "Adding…" : "Add item"}
        </Button>
      </form>

      <DeleteChecklistDialog
        id={checklist.id}
        name={checklist.name}
        itemCount={items.length}
        redirectToList
        label="text"
      />

      <Dialog
        open={editing != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setEditError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              key={editing.id}
              className="flex flex-col gap-4"
              action={(formData) => {
                setEditError(null);
                startEdit(async () => {
                  const message = await updateChecklistItem(formData);
                  if (message) {
                    setEditError(message);
                    return;
                  }
                  setEditing(null);
                });
              }}
            >
              <input type="hidden" name="id" value={editing.id} />
              <input type="hidden" name="checklist_id" value={checklist.id} />
              <ItemFields
                idPrefix={`edit-${editing.id}`}
                defaultTitle={editing.title}
                defaultQuantity={
                  editing.quantity == null ? "" : formatStoredQuantity(editing.quantity)
                }
                defaultUnit={editing.unit ?? ""}
                defaultScales={editing.scales}
              />
              {editError ? (
                <p role="alert" className="text-sm text-destructive">
                  {editError}
                </p>
              ) : null}
              <Button type="submit" disabled={editPending}>
                {editPending ? "Saving…" : "Save item"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
