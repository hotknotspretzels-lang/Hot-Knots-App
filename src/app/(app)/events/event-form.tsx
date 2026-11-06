"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Contact } from "@/lib/types";
import { ContactSelect } from "@/app/(app)/contacts/contact-select";
import { EventDaysFields } from "./event-days-fields";
import { EventOnlyFields } from "./event-type-fields";
import { createEvent } from "./actions";

export function EventForm({
  defaultDate,
  contacts,
  onDone,
}: {
  defaultDate?: string;
  contacts: Contact[];
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createEvent(formData);
        formRef.current?.reset();
        onDone?.();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="event-name">Name</Label>
        <Input
          id="event-name"
          name="name"
          required
          placeholder="Downtown Summer Festival"
        />
      </div>
      <EventDaysFields defaultDate={defaultDate} />
      <EventOnlyFields />
      <div className="flex flex-col gap-2">
        <Label htmlFor="event-contact">Contact (optional)</Label>
        <ContactSelect id="event-contact" contacts={contacts} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="event-notes">Notes</Label>
        <Textarea id="event-notes" name="notes" rows={3} />
      </div>
      <Button type="submit">Add event</Button>
    </form>
  );
}
