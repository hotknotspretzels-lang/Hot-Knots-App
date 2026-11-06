"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTodoItem } from "./actions";

export function AddItemForm({ categoryId }: { categoryId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTodoItem(formData);
        formRef.current?.reset();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="category_id" value={categoryId} />
      <Input name="title" required placeholder="Add an item" aria-label="New item" />
      <Button type="submit" variant="outline">
        Add
      </Button>
    </form>
  );
}
