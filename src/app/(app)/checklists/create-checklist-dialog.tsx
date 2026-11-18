"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createChecklist } from "./actions";

export function CreateChecklistDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger render={<Button size="sm">New checklist</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New checklist</DialogTitle>
          <DialogDescription>
            Name it for the job, like Event load-out, Opening, Closing, or Prep for 100 customers.
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const message = await createChecklist(formData);
              if (message) setError(message);
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="checklist-name">Name</Label>
            <Input
              id="checklist-name"
              name="name"
              required
              maxLength={120}
              placeholder="Event load-out"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="checklist-base">Written for how many customers?</Label>
            <Input
              id="checklist-base"
              name="base_customer_count"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              defaultValue={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              Item quantities are the amounts you need for this many people. You can scale them
              before each event.
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create checklist"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
