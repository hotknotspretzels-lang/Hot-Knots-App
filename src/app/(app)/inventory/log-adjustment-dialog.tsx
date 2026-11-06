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
import { logAdjustment } from "./actions";

export function LogAdjustmentDialog({
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
      <DialogTrigger render={<Button variant="ghost" size="sm">Adjust</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {itemName}</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await logAdjustment(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="inventory_item_id" value={inventoryItemId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="adjustment-quantity">
              Change ({unitOfMeasure}) — positive to add, negative to remove
            </Label>
            <Input
              id="adjustment-quantity"
              name="quantity"
              type="number"
              step="0.0001"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adjustment-date">Date</Label>
            <Input
              id="adjustment-date"
              name="transaction_date"
              type="date"
              defaultValue={today}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adjustment-notes">Notes</Label>
            <Textarea
              id="adjustment-notes"
              name="notes"
              rows={2}
              placeholder="Physical count correction..."
            />
          </div>
          <Button type="submit">Save adjustment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
