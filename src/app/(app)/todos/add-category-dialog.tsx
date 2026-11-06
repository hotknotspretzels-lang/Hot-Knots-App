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
import { createTodoCategory } from "./actions";

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Add category</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to-do category</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await createTodoCategory(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-category-name">Name</Label>
            <Input id="todo-category-name" name="name" required placeholder="Supplies to buy" />
          </div>
          <Button type="submit">Add category</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
