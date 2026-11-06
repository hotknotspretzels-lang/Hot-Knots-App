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
import { createIngredient } from "./actions";

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  packaging: "Packaging",
  other: "Other",
};

export function AddIngredientDialog() {
  const [open, setOpen] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    setIsPrepared(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Add ingredient</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add ingredient</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            formData.set("is_prepared", String(isPrepared));
            await createIngredient(formData);
            formRef.current?.reset();
            reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="ingredient-name">Name</Label>
            <Input
              id="ingredient-name"
              name="name"
              required
              placeholder="Cheddar Cheese"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ingredient-category">Category</Label>
              <Select name="category" items={CATEGORY_LABELS} defaultValue="food">
                <SelectTrigger id="ingredient-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="packaging">Packaging</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ingredient-unit">Unit of measure</Label>
              <Input
                id="ingredient-unit"
                name="unit_of_measure"
                defaultValue="unit"
                placeholder="lb, fl oz, each..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isPrepared ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPrepared(false)}
              >
                Raw (purchased)
              </Button>
              <Button
                type="button"
                variant={isPrepared ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPrepared(true)}
              >
                Prepared (batch-made)
              </Button>
            </div>
          </div>

          {!isPrepared ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="ingredient-cost">Cost per unit ($)</Label>
              <Input
                id="ingredient-cost"
                name="current_unit_cost"
                type="number"
                step="0.0001"
                min="0"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ingredient-yield-qty">Batch yields</Label>
                <Input
                  id="ingredient-yield-qty"
                  name="yield_quantity"
                  type="number"
                  step="0.0001"
                  min="0"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ingredient-yield-unit">Yield unit</Label>
                <Input
                  id="ingredient-yield-unit"
                  name="yield_unit_of_measure"
                  placeholder="fl oz, each..."
                />
              </div>
            </div>
          )}

          {isPrepared ? (
            <p className="text-xs text-muted-foreground">
              After saving, use the Recipe button on this ingredient to build its
              batch recipe — cost per unit is computed from that.
            </p>
          ) : null}

          <Button type="submit">Add ingredient</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
