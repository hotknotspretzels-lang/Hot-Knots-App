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
import { EXPENSE_CATEGORY_LABELS, type Event } from "@/lib/types";
import { createExpense } from "./actions";

export function AddExpenseDialog({ events }: { events: Event[] }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("fuel");
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Log expense</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log expense</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await createExpense(formData);
            formRef.current?.reset();
            setCategory("fuel");
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select
                name="category"
                items={EXPENSE_CATEGORY_LABELS}
                value={category}
                onValueChange={(v) => setCategory(v ?? "fuel")}
              >
                <SelectTrigger id="expense-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense-amount">Amount ($)</Label>
              <Input
                id="expense-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {category === "fuel" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-gallons">Gallons</Label>
                <Input
                  id="expense-gallons"
                  name="gallons"
                  type="number"
                  step="0.001"
                  min="0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="expense-mileage">Mileage</Label>
                <Input
                  id="expense-mileage"
                  name="mileage"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-event">Event (optional)</Label>
            <Select
              name="event_id"
              items={Object.fromEntries(
                events.map((e) => [
                  e.id,
                  `${e.name} (${new Date(e.event_date + "T00:00:00").toLocaleDateString()})`,
                ]),
              )}
            >
              <SelectTrigger id="expense-event" className="w-full">
                <SelectValue placeholder="Overhead (no event)" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({new Date(e.event_date + "T00:00:00").toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              name="expense_date"
              type="date"
              defaultValue={today}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense-notes">Notes</Label>
            <Textarea id="expense-notes" name="notes" rows={2} />
          </div>

          <Button type="submit">Log expense</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
