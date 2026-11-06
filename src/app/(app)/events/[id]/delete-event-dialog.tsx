"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "../actions";

export function DeleteEventDialog({
  eventId,
  eventName,
  transactionCount,
}: {
  eventId: string;
  eventName: string;
  transactionCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            Delete event
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{eventName}&quot;?</DialogTitle>
          <DialogDescription>
            This permanently deletes the event
            {transactionCount > 0
              ? ` and its ${transactionCount} sales transaction${transactionCount === 1 ? "" : "s"} (and the inventory usage they generated)`
              : ""}
            . Expenses and inventory logs tied to this event are kept but
            unlinked. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={eventId} />
            <Button variant="destructive" size="sm" type="submit">
              Delete event
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
