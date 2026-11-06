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
import { logUsage } from "./actions";

export function LogUsageDialog({
  inventoryItemId,
  itemName,
  unitOfMeasure,
}: {
  inventoryItemId: string;
  itemName: string;
  unitOfMeasure: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm">Log usage</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log usage — {itemName}</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await logUsage(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="inventory_item_id" value={inventoryItemId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="usage-quantity">Quantity used ({unitOfMeasure})</Label>
            <Input
              id="usage-quantity"
              name="quantity"
              type="number"
              step="0.0001"
              min="0"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="usage-date">Date</Label>
            <Input
              id="usage-date"
              name="transaction_date"
              type="date"
              defaultValue={today}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="usage-notes">Notes</Label>
            <Textarea
              id="usage-notes"
              name="notes"
              rows={2}
              placeholder="Staff meal, sampling, off-menu use..."
            />
          </div>
          <Button type="submit">Log usage</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
