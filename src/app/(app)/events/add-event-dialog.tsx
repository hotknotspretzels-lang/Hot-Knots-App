"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/lib/types";
import { EventForm } from "./event-form";

export function AddEventDialog({
  defaultDate,
  contacts,
  trigger,
}: {
  defaultDate?: string;
  contacts: Contact[];
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button size="sm">Add event</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
        </DialogHeader>
        <EventForm
          defaultDate={defaultDate}
          contacts={contacts}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
