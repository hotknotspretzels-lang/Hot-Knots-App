"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contact } from "@/lib/types";
import { ContactSelect } from "@/app/(app)/contacts/contact-select";
import { EventDaysFields } from "@/app/(app)/events/event-days-fields";
import { EventOnlyFields } from "@/app/(app)/events/event-type-fields";
import { createEvent } from "@/app/(app)/events/actions";
import { createCalendarTask } from "./actions";

type Kind = "event" | "other";

const KIND_LABELS: Record<Kind, string> = {
  event: "Event",
  other: "Other",
};

export function AddCalendarItemDialog({
  defaultDate,
  contacts,
  trigger,
}: {
  defaultDate?: string;
  contacts: Contact[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("other");
  const formRef = useRef<HTMLFormElement>(null);

  function close() {
    setOpen(false);
    setKind("other");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setKind("other");
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to calendar</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            if (kind === "event") {
              await createEvent(formData);
            } else {
              await createCalendarTask(formData);
            }
            formRef.current?.reset();
            close();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-kind">Type</Label>
            <Select
              items={KIND_LABELS}
              value={kind}
              onValueChange={(v) => v && setKind(v as Kind)}
            >
              <SelectTrigger id="item-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">{kind === "event" ? "Name" : "Title"}</Label>
            <Input
              id="item-name"
              name={kind === "event" ? "name" : "title"}
              required
              placeholder={
                kind === "event" ? "Downtown Summer Festival" : "Vendor application due"
              }
            />
          </div>

          {kind === "event" ? (
            <EventDaysFields defaultDate={defaultDate} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-date">Date</Label>
                <Input
                  id="item-date"
                  name="due_date"
                  type="date"
                  defaultValue={defaultDate}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="item-time">Time</Label>
                <Input id="item-time" name="due_time" type="time" />
              </div>
            </div>
          )}

          {kind === "event" && <EventOnlyFields />}

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-contact">Contact (optional)</Label>
            <ContactSelect id="item-contact" contacts={contacts} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-notes">Notes</Label>
            <Textarea id="item-notes" name="notes" rows={3} />
          </div>

          <Button type="submit">
            {kind === "event" ? "Add event" : "Add to calendar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
