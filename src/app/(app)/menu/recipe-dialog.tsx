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
import type { InventoryItem } from "@/lib/types";
import { saveRecipe } from "./actions";
import { Trash2 } from "lucide-react";

interface Row {
  key: number;
  componentId: string;
  quantity: number;
}

export function RecipeDialog({
  targetType,
  targetId,
  targetName,
  ingredients,
  costMap,
  existingRows,
}: {
  targetType: "menu_item" | "inventory_item";
  targetId: string;
  targetName: string;
  ingredients: InventoryItem[];
  costMap: Map<string, number>;
  existingRows: { componentId: string; quantity: number }[];
}) {
  const [open, setOpen] = useState(false);
  const nextKey = useRef(0);
  const [rows, setRows] = useState<Row[]>(() => toRows(existingRows));
  const formRef = useRef<HTMLFormElement>(null);

  function toRows(source: { componentId: string; quantity: number }[]): Row[] {
    if (source.length === 0) {
      nextKey.current = 1;
      return [{ key: 0, componentId: "", quantity: 1 }];
    }
    nextKey.current = source.length;
    return source.map((r, i) => ({ key: i, ...r }));
  }

  const availableIngredients = ingredients.filter((i) => i.id !== targetId);
  const ingredientLabels = Object.fromEntries(
    availableIngredients.map((item) => [
      item.id,
      `${item.name} ($${(costMap.get(item.id) ?? 0).toFixed(4)}/${item.unit_of_measure})`,
    ]),
  );

  function addRow() {
    setRows((r) => [...r, { key: nextKey.current++, componentId: "", quantity: 1 }]);
  }

  function removeRow(key: number) {
    setRows((r) => r.filter((row) => row.key !== key));
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  const total = rows.reduce(
    (sum, r) => sum + r.quantity * (costMap.get(r.componentId) ?? 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Recipe</Button>} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{targetName} — recipe</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            formData.set("target_type", targetType);
            formData.set("target_id", targetId);
            await saveRecipe(formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <div key={row.key} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Ingredient</Label>
                  <Select
                    name="component_id"
                    items={ingredientLabels}
                    value={row.componentId}
                    onValueChange={(v) => updateRow(row.key, { componentId: v ?? "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIngredients.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (${(costMap.get(item.id) ?? 0).toFixed(4)}/
                          {item.unit_of_measure})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-24 flex-col gap-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    name="quantity"
                    step="0.0001"
                    min="0"
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(row.key, { quantity: Number(e.target.value) || 0 })
                    }
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
              Add ingredient
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Total cost: ${total.toFixed(4)}
          </p>

          <Button type="submit">Save recipe</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
