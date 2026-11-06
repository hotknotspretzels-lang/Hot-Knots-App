"use client";

import { useRef, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventoryItem } from "@/lib/types";
import { logPurchaseBatch } from "./actions";
import { Trash2 } from "lucide-react";

interface Row {
  key: number;
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
}

export function PurchaseForm({ ingredients }: { ingredients: InventoryItem[] }) {
  const [rows, setRows] = useState<Row[]>([
    { key: 0, inventoryItemId: "", quantity: "", unitCost: "" },
  ]);
  const nextKey = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const ingredientLabels = Object.fromEntries(ingredients.map((i) => [i.id, i.name]));

  function addRow() {
    setRows((r) => [
      ...r,
      { key: nextKey.current++, inventoryItemId: "", quantity: "", unitCost: "" },
    ]);
  }

  function removeRow(key: number) {
    setRows((r) => r.filter((row) => row.key !== key));
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function reset() {
    setRows([{ key: 0, inventoryItemId: "", quantity: "", unitCost: "" }]);
    nextKey.current = 1;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a purchase</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={async (formData) => {
            await logPurchaseBatch(formData);
            reset();
            formRef.current?.reset();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.key} className="flex flex-wrap items-end gap-2">
                <div className="flex min-w-48 flex-1 flex-col gap-1">
                  <Label className="text-xs">Ingredient</Label>
                  <Select
                    name="inventory_item_id"
                    items={ingredientLabels}
                    value={row.inventoryItemId}
                    onValueChange={(v) => updateRow(row.key, { inventoryItemId: v ?? "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-24 flex-col gap-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    name="quantity"
                    step="0.0001"
                    min="0"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                  />
                </div>
                <div className="flex w-28 flex-col gap-1">
                  <Label className="text-xs">Cost/unit ($)</Label>
                  <Input
                    type="number"
                    name="unit_cost"
                    step="0.0001"
                    min="0"
                    value={row.unitCost}
                    onChange={(e) => updateRow(row.key, { unitCost: e.target.value })}
                  />
                </div>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchase-date">Date</Label>
              <Input
                id="purchase-date"
                name="transaction_date"
                type="date"
                defaultValue={today}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchase-notes">Notes</Label>
              <Input
                id="purchase-notes"
                name="notes"
                placeholder="Supplier, invoice #..."
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Entering a cost updates that ingredient&apos;s current cost per unit too.
          </p>

          <Button type="submit" className="self-start">
            Save purchase
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
