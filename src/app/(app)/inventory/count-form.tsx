"use client";

import { useRef } from "react";
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
import { logCount } from "./actions";

export function CountForm({ ingredients }: { ingredients: InventoryItem[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const ingredientLabels = Object.fromEntries(ingredients.map((i) => [i.id, i.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a stock count</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={async (formData) => {
            await logCount(formData);
            formRef.current?.reset();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-xs text-muted-foreground">
            Enter what&apos;s actually on the shelf for an ingredient. This
            reconciles on-hand going forward and is what the Reports tab uses to
            calculate actual usage for the month.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="count-item">Ingredient</Label>
              <Select name="inventory_item_id" items={ingredientLabels} required>
                <SelectTrigger id="count-item" className="w-full">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="count-quantity">Counted quantity</Label>
              <Input
                id="count-quantity"
                name="counted_quantity"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="count-date">Count date</Label>
              <Input id="count-date" name="count_date" type="date" defaultValue={today} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="count-notes">Notes</Label>
              <Input id="count-notes" name="notes" placeholder="Optional" />
            </div>
          </div>
          <Button type="submit" className="self-start">
            Save count
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
