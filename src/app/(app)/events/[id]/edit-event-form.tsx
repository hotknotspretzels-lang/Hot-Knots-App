"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Event } from "@/lib/types";
import { updateEventDetails } from "@/app/(app)/events/actions";

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function EditEventForm({ event }: { event: Event }) {
  return (
    <form action={updateEventDetails} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={event.id} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expected-attendance">Expected attendance</Label>
          <Input
            id="expected-attendance"
            name="expected_attendance"
            type="number"
            min="0"
            defaultValue={event.expected_attendance ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="actual-attendance">Actual attendance</Label>
          <Input
            id="actual-attendance"
            name="actual_attendance"
            type="number"
            min="0"
            defaultValue={event.actual_attendance ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" items={STATUS_LABELS} defaultValue={event.status}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="weather">Weather</Label>
          <Input
            id="weather"
            name="weather_condition"
            defaultValue={event.weather_condition ?? ""}
            placeholder="Sunny, windy, rain..."
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="temp-high">High temp (°F)</Label>
          <Input
            id="temp-high"
            name="temperature_high"
            type="number"
            defaultValue={event.temperature_high ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="booth-fee-edit">Booth fee ($)</Label>
          <Input
            id="booth-fee-edit"
            name="booth_fee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={event.booth_fee ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="booth-fee-percent-edit">Booth fee (% of sales)</Label>
          <Input
            id="booth-fee-percent-edit"
            name="booth_fee_percent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={event.booth_fee_percent ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="event-notes-edit">Notes</Label>
        <Textarea
          id="event-notes-edit"
          name="notes"
          rows={3}
          defaultValue={event.notes ?? ""}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="event-is-public-edit"
          name="is_public"
          defaultChecked={event.is_public}
        />
        <Label htmlFor="event-is-public-edit" className="font-normal">
          Show on public site schedule
        </Label>
      </div>
      <Button type="submit" variant="outline" className="self-start">
        Save details
      </Button>
    </form>
  );
}
