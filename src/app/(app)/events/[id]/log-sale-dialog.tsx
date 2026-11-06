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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MenuItem } from "@/lib/types";
import { createSalesTransaction } from "@/app/(app)/sales/actions";
import { Trash2 } from "lucide-react";

interface Row {
  key: number;
  menuItemId: string;
  quantity: number;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  other: "Other",
};

export function LogSaleDialog({
  eventId,
  menuItems,
}: {
  eventId: string;
  menuItems: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([{ key: 0, menuItemId: "", quantity: 1 }]);
  const nextKey = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);

  const priceFor = (menuItemId: string) =>
    menuItems.find((m) => m.id === menuItemId)?.price ?? 0;

  const menuItemLabels = Object.fromEntries(
    menuItems.map((item) => [item.id, `${item.name} ($${item.price.toFixed(2)})`]),
  );

  const subtotal = rows.reduce(
    (sum, r) => sum + r.quantity * priceFor(r.menuItemId),
    0,
  );

  function addRow() {
    setRows((r) => [...r, { key: nextKey.current++, menuItemId: "", quantity: 1 }]);
  }

  function removeRow(key: number) {
    setRows((r) => r.filter((row) => row.key !== key));
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function reset() {
    setRows([{ key: 0, menuItemId: "", quantity: 1 }]);
    nextKey.current = 1;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Log sale</Button>} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log sale</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await createSalesTransaction(formData);
            reset();
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="event_id" value={eventId} />

          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.key} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Item</Label>
                  <Select
                    name="menu_item_id"
                    items={menuItemLabels}
                    value={row.menuItemId}
                    onValueChange={(v) => updateRow(row.key, { menuItemId: v ?? "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (${item.price.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-20 flex-col gap-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    name="quantity"
                    min="1"
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(row.key, { quantity: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <input
                  type="hidden"
                  name="unit_price"
                  value={priceFor(row.menuItemId)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              Add item
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sale-tax">Tax ($)</Label>
              <Input id="sale-tax" name="tax" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sale-tip">Tip ($)</Label>
              <Input id="sale-tip" name="tip" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sale-discount">Discount ($)</Label>
              <Input
                id="sale-discount"
                name="discount"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sale-payment">Payment method</Label>
            <Select
              name="payment_method"
              items={PAYMENT_METHOD_LABELS}
              defaultValue="cash"
            >
              <SelectTrigger id="sale-payment" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Subtotal: ${subtotal.toFixed(2)}
          </p>

          <Button type="submit">Save sale</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
