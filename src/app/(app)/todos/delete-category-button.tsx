"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTodoCategory } from "./actions";

export function DeleteCategoryButton({
  id,
  name,
  openCount,
}: {
  id: string;
  name: string;
  openCount: number;
}) {
  return (
    <form
      action={deleteTodoCategory}
      onSubmit={(e) => {
        if (
          openCount > 0 &&
          !confirm(`Delete "${name}" and its ${openCount} open item${openCount === 1 ? "" : "s"}?`)
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button variant="ghost" size="icon-sm" type="submit" aria-label={`Delete ${name}`}>
        <Trash2Icon />
      </Button>
    </form>
  );
}
