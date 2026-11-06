"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPE_LABELS } from "@/lib/types";

export function EventOnlyFields() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="event-type">Event type</Label>
          <Select name="event_type" items={EVENT_TYPE_LABELS} required>
            <SelectTrigger id="event-type" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="event-location">Location</Label>
          <Input id="event-location" name="location" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="event-attendance">Expected attendance</Label>
        <Input
          id="event-attendance"
          name="expected_attendance"
          type="number"
          min="0"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="event-booth-fee">Booth fee ($)</Label>
          <Input
            id="event-booth-fee"
            name="booth_fee"
            type="number"
            step="0.01"
            min="0"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="event-booth-fee-percent">Booth fee (% of sales)</Label>
          <Input
            id="event-booth-fee-percent"
            name="booth_fee_percent"
            type="number"
            step="0.01"
            min="0"
            max="100"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="event-is-public" name="is_public" defaultChecked />
        <Label htmlFor="event-is-public" className="font-normal">
          Show on public site schedule
        </Label>
      </div>
    </>
  );
}
