"use client";

import { Button } from "@/components/ui/button";
import type { EventDay } from "@/lib/types";
import { EventDaysFields } from "@/app/(app)/events/event-days-fields";
import { updateEventSchedule } from "@/app/(app)/events/actions";

export function EditScheduleForm({
  eventId,
  defaultDate,
  days,
}: {
  eventId: string;
  defaultDate: string;
  days: EventDay[];
}) {
  return (
    <form action={updateEventSchedule} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={eventId} />
      <EventDaysFields defaultDate={defaultDate} initialDays={days} />
      <Button type="submit" variant="outline" className="self-start">
        Save schedule
      </Button>
    </form>
  );
}
