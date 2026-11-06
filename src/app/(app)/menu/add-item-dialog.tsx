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
import type { MenuCategory } from "@/lib/types";
import { createMenuItem } from "./actions";

export function AddItemDialog({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Add menu item</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add menu item</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await createMenuItem(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" name="name" required placeholder="Hot Dog" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-category">Category</Label>
            <Select
              name="category_id"
              items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
            >
              <SelectTrigger id="item-category">
                <SelectValue placeholder="Uncategorized" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-price">Price ($)</Label>
              <Input
                id="item-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-unit">Unit of measure</Label>
              <Input
                id="item-unit"
                name="unit_of_measure"
                defaultValue="each"
                placeholder="each"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Food cost is computed from the item's recipe — add one after creating
            this item.
          </p>
          <Button type="submit">Add item</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
