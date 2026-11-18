"use client";

import { useRef, useState, useTransition } from "react";
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
import {
  createChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
  updateChecklist,
  updateChecklistItem,
} from "../actions";
import { ConfirmDialog } from "../confirm-dialog";
import { DeleteChecklistDialog } from "../delete-checklist-dialog";

export function EditList({ checklist, items }: { checklist: Checklist; items: ChecklistItem[] }) {
  const addInputRef = useRef<HTMLInputElement>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [settingsPending, startSettings] = useTransition();
  const [, startAdd] = useTransition();
  const [editPending, startEdit] = useTransition();
  const [movePending, startMove] = useTransition();

  function keepTyping(input: HTMLInputElement | null) {
    if (!input) return;
    input.value = "";
    input.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        className="sticky top-0 z-10 flex gap-2 bg-background py-1"
        action={(formData) => {
          const input = addInputRef.current;
          const title = String(formData.get("title") ?? "");
          setAddError(null);
          keepTyping(input);
          startAdd(async () => {
            const message = await createChecklistItem(formData);
            if (message) {
              setAddError(message);
              if (input) input.value = title;
              input?.focus();
              return;
            }
            keepTyping(input);
          });
        }}
      >
        <input type="hidden" name="checklist_id" value={checklist.id} />
        <Input
          ref={addInputRef}
          name="title"
          required
          maxLength={200}
          placeholder="Add an item"
          aria-label="New item"
          autoComplete="off"
          enterKeyHint="done"
          autoFocus
          className="h-11 text-base"
        />
        <Button type="submit" className="h-11 px-4">
          Add
        </Button>
      </form>
      {addError ? (
        <p role="alert" className="text-sm text-destructive">
          {addError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet. Type one and press enter.</p>
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
              <p className="min-w-0 flex-1 break-words font-medium">{item.title}</p>
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
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.title}`}>
                    <Trash2Icon />
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
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
        {settingsError ? (
          <p role="alert" className="text-sm text-destructive">
            {settingsError}
          </p>
        ) : null}
        <Button type="submit" variant="outline" disabled={settingsPending}>
          {settingsPending ? "Saving…" : "Save name"}
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
              <div className="flex flex-col gap-2">
                <Label htmlFor={`edit-item-${editing.id}`}>Item</Label>
                <Input
                  id={`edit-item-${editing.id}`}
                  name="title"
                  required
                  maxLength={200}
                  defaultValue={editing.title}
                  autoComplete="off"
                />
              </div>
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
